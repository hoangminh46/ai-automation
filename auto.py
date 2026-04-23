#!/usr/bin/env python3
"""
Cross-platform Auto-Retry for Antigravity / VS Code / Cursor IDE.
Tự động nhấn Retry, Accept, Allow, Run khi dialog error xuất hiện.

Usage:
    python3 auto-retry-core.py              # chạy foreground
    python3 auto-retry-core.py --dry-run    # scan only
    python3 auto-retry-core.py --stop       # dừng instance
"""

import argparse
import os
import platform
import signal
import subprocess
import sys
import tempfile
import time
from datetime import datetime
from pathlib import Path

SYSTEM = platform.system()
PIDFILE = Path("/tmp/antigravity-auto-retry.pid") if SYSTEM != "Windows" \
    else Path(os.environ.get("TEMP", "C:\\Temp")) / "antigravity-auto-retry.pid"
LOGFILE = PIDFILE.with_suffix(".log")

# Buttons to auto-click (case-insensitive match)
TARGET_BUTTONS = ["Retry", "Run", "Accept", "Allow", "Yes"]

# IDE process names to scan
IDE_NAMES_LOWER = {"antigravity", "code", "cursor", "electron"}

POLL_INTERVAL = 1.5  # Faster polling

_ANSI = SYSTEM != "Windows" or os.environ.get("WT_SESSION")

class C:
    G = "\033[0;32m" if _ANSI else ""
    R = "\033[0;31m" if _ANSI else ""
    Y = "\033[1;33m" if _ANSI else ""
    B = "\033[0;36m" if _ANSI else ""
    D = "\033[2m" if _ANSI else ""
    N = "\033[0m" if _ANSI else ""


def log(msg, level="info"):
    ts = datetime.now().strftime("%H:%M:%S")
    icons = {"ok": "✓", "warn": "⚠", "err": "✗", "info": "ℹ", "dbg": "…"}
    cols = {"ok": C.G, "warn": C.Y, "err": C.R, "info": C.B, "dbg": C.D}
    print(f"[{ts}] {cols.get(level, '')}{icons.get(level, ' ')}{C.N} {msg}", flush=True)
    try:
        # Rotate log if > 1MB
        if LOGFILE.exists() and LOGFILE.stat().st_size > 1_048_576:
            LOGFILE.write_text("", encoding="utf-8")
        with LOGFILE.open("a", encoding="utf-8") as f:
            f.write(f"[{ts}] {msg}\n")
    except OSError:
        pass


def write_pid():
    PIDFILE.write_text(str(os.getpid()))

def cleanup_pid():
    try:
        PIDFILE.unlink(missing_ok=True)
    except Exception:
        pass

def stop_existing():
    if not PIDFILE.exists():
        log("No running instance", "warn")
        return
    try:
        pid = int(PIDFILE.read_text().strip())
        if SYSTEM == "Windows":
            subprocess.run(
                ["taskkill", "/PID", str(pid), "/F"],
                capture_output=True, timeout=5
            )
        else:
            os.kill(pid, signal.SIGTERM)
        log(f"Stopped PID {pid}", "ok")
    except Exception:
        log("Already stopped", "warn")
    cleanup_pid()

def check_dup():
    if not PIDFILE.exists(): return
    try:
        pid = int(PIDFILE.read_text().strip())
        running = False
        if SYSTEM == "Windows":
            out = subprocess.check_output(f'tasklist /FI "PID eq {pid}" /NH', shell=True, stderr=subprocess.DEVNULL).decode(errors='ignore')
            running = str(pid) in out
        else:
            try:
                os.kill(pid, 0)
                running = True
            except OSError:
                running = False
        
        if running:
            log(f"Already running (PID {pid}). Use --stop first.", "err")
            sys.exit(1)
        else:
            cleanup_pid()
    except Exception:
        cleanup_pid()


# ==========================================================================
# Linux AT-SPI2 Scanner — optimized for speed
# ==========================================================================

def linux_scan(buttons, dry_run=False, verbose=False):
    """
    Returns: 1=clicked, 0=nothing found, -1=no IDE
    """
    import gi
    gi.require_version("Atspi", "2.0")
    from gi.repository import Atspi

    desktop = Atspi.get_desktop(0)
    if not desktop:
        return -1

    target_lower = {b.lower() for b in buttons}
    ide_apps = []

    for i in range(desktop.get_child_count()):
        try:
            ch = desktop.get_child_at_index(i)
            if ch and any(p in (ch.get_name() or "").lower() for p in IDE_NAMES_LOWER):
                ide_apps.append(ch)
        except Exception:
            pass

    if not ide_apps:
        return -1

    for app in ide_apps:
        result = _walk_and_click(app, target_lower, dry_run, verbose, Atspi)
        if result != 0:
            return result
    return 0


def _walk_and_click(node, targets, dry_run, verbose, Atspi, depth=0, max_depth=30):
    """DFS walk, optimized: skip deep branches early, match buttons."""
    if node is None or depth > max_depth:
        return 0

    try:
        role = node.get_role()
        name = (node.get_name() or "").strip()

        # Check if this is a button matching our targets
        if role == Atspi.Role.PUSH_BUTTON and name and name.lower() in targets:
            if dry_run:
                log(f"[DRY-RUN] Found button [{name}]", "info")
                return 0

            # Try action interface first
            try:
                action = node.get_action_iface()
                if action and action.get_n_actions() > 0:
                    action.do_action(0)
                    log(f"Clicked [{name}] via action API", "ok")
                    return 1
            except Exception:
                pass

            # Fallback: grab focus + Enter key
            try:
                comp = node.get_component_iface()
                if comp:
                    comp.grab_focus()
                    time.sleep(0.05)
                    Atspi.generate_keyboard_event(36, "", Atspi.KeySynthType.PRESSRELEASE)
                    log(f"Clicked [{name}] via focus+Enter", "ok")
                    return 1
            except Exception:
                pass

            log(f"Found [{name}] but failed to click", "warn")
            return 0

        # Also check for links/labels with "Retry" that might be clickable
        if name and name.lower() in targets and role in (
            Atspi.Role.LINK, Atspi.Role.LABEL, Atspi.Role.TOGGLE_BUTTON
        ):
            if not dry_run:
                try:
                    action = node.get_action_iface()
                    if action and action.get_n_actions() > 0:
                        action.do_action(0)
                        log(f"Clicked [{name}] ({node.get_role_name()}) via action", "ok")
                        return 1
                except Exception:
                    pass

        # Recurse into children
        try:
            cc = node.get_child_count()
            for i in range(cc):
                result = _walk_and_click(
                    node.get_child_at_index(i), targets, dry_run, verbose, Atspi,
                    depth + 1, max_depth
                )
                if result != 0:
                    return result
        except Exception:
            pass

    except Exception:
        pass

    return 0


# ==========================================================================
# macOS AppleScript Scanner
# ==========================================================================

def macos_scan(buttons, dry_run=False, verbose=False):
    btn_list = ", ".join(f'"{b}"' for b in buttons)
    script = f'''
    set tgt to {{{btn_list}}}
    set procs to {{"antigravity", "Code", "Cursor", "Electron"}}
    tell application "System Events"
        set ap to name of every process whose background only is false
        repeat with p in procs
            if ap contains p then
                tell process p
                    repeat with w in (every window)
                        try
                            repeat with b in (every button of w)
                                set bn to name of b
                                repeat with t in tgt
                                    if bn is equal to t then
                                        if "{dry_run}" is "True" then return "FOUND:" & bn
                                        click b
                                        return "CLICKED:" & bn
                                    end if
                                end repeat
                            end repeat
                        end try
                        try
                            repeat with g in (every group of w)
                                repeat with b in (every button of g)
                                    set bn to name of b
                                    repeat with t in tgt
                                        if bn is equal to t then
                                            if "{dry_run}" is "True" then return "FOUND:" & bn
                                            click b
                                            return "CLICKED:" & bn
                                        end if
                                    end repeat
                                end repeat
                            end repeat
                        end try
                    end repeat
                end tell
            end if
        end repeat
    end tell
    return "NONE"
    '''
    try:
        r = subprocess.run(["osascript", "-e", script], capture_output=True, text=True, timeout=10)
        out = r.stdout.strip()
        if out.startswith("CLICKED:"): return 1
        if out.startswith("FOUND:"):
            log(f"[DRY-RUN] Found [{out.split(':')[1]}]", "info"); return 0
        return 0
    except Exception:
        return -1


# ==========================================================================
# Windows PowerShell Scanner — cached script for performance
# ==========================================================================

_ps_script_path: str | None = None

def _get_ps_script(buttons: list[str], dry_run: bool) -> str:
    """Write PS script to temp file once, reuse on subsequent calls."""
    global _ps_script_path
    if _ps_script_path and Path(_ps_script_path).exists():
        return _ps_script_path

    btn_names = ",".join(f"'{b}'" for b in buttons)
    ps = f'''$ErrorActionPreference="SilentlyContinue"
Add-Type -AssemblyName UIAutomationClient,UIAutomationTypes
$root=[System.Windows.Automation.AutomationElement]::RootElement
$tgt=@({btn_names})
$bc=New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
    [System.Windows.Automation.ControlType]::Button)
$wins=$root.FindAll([System.Windows.Automation.TreeScope]::Children,
    [System.Windows.Automation.Condition]::TrueCondition)
foreach($w in $wins){{
    $wn=$w.Current.Name
    if($wn -notmatch "antigravity|code|cursor|electron"){{continue}}
    $btns=$w.FindAll([System.Windows.Automation.TreeScope]::Descendants,$bc)
    foreach($b in $btns){{
        $bn=$b.Current.Name
        foreach($t in $tgt){{
            if($bn -eq $t){{
                if("{dry_run}" -eq "True"){{Write-Output "FOUND:$bn";exit 0}}
                $ip=$b.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
                if($ip){{$ip.Invoke();Write-Output "CLICKED:$bn";exit 0}}
            }}
        }}
    }}
}}
Write-Output "NONE"
'''
    fd, path = tempfile.mkstemp(suffix=".ps1", prefix="auto-retry-")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        f.write(ps)
    _ps_script_path = path
    return path


def windows_scan(buttons, dry_run=False, verbose=False):
    script_path = _get_ps_script(buttons, dry_run)
    try:
        r = subprocess.run(
            ["powershell", "-NoProfile", "-NonInteractive",
             "-ExecutionPolicy", "Bypass", "-File", script_path],
            capture_output=True, text=True, timeout=15
        )
        out = r.stdout.strip()
        if out.startswith("CLICKED:"):
            return 1
        if out.startswith("FOUND:"):
            log(f"[DRY-RUN] Found [{out.split(':')[1]}]", "info")
            return 0
        return 0
    except Exception:
        return -1


def scan(buttons, dry_run=False, verbose=False):
    if SYSTEM == "Linux":
        try:
            return linux_scan(buttons, dry_run, verbose)
        except ImportError:
            log("AT-SPI2 unavailable. Install: sudo apt install python3-gi gir1.2-atspi-2.0", "err")
            return -1
    elif SYSTEM == "Darwin":
        return macos_scan(buttons, dry_run, verbose)
    elif SYSTEM == "Windows":
        return windows_scan(buttons, dry_run, verbose)
    else:
        log(f"Unsupported OS: {SYSTEM}", "err")
        return -1


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description="Auto-retry for Antigravity IDE")
    parser.add_argument("--stop", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--verbose", "-v", action="store_true")
    parser.add_argument("--once", action="store_true")
    parser.add_argument("--interval", type=float, default=POLL_INTERVAL)
    parser.add_argument("--buttons", nargs="+", default=TARGET_BUTTONS)
    args = parser.parse_args()

    if args.stop:
        stop_existing(); return

    check_dup()
    write_pid()
    def graceful_exit(*_):
        log("Stopped")
        cleanup_pid()
        if SYSTEM == "Windows" and _ps_script_path:
            try:
                Path(_ps_script_path).unlink(missing_ok=True)
            except Exception:
                pass
        sys.exit(0)

    signal.signal(signal.SIGINT, graceful_exit)
    if SYSTEM != "Windows":
        signal.signal(signal.SIGTERM, graceful_exit)

    os_icon = {"Linux": "🐧", "Darwin": "🍎", "Windows": "🪟"}.get(SYSTEM, "💻")
    mode = "DRY-RUN" if args.dry_run else "ACTIVE"
    btns = ", ".join(args.buttons)

    print(f"\n{C.G}🤖 Auto-Retry [{mode}] {os_icon} {SYSTEM} | Poll: {args.interval}s{C.N}")
    print(f"{C.G}   Buttons: {btns}{C.N}")
    print(f"{C.G}   Stop: Ctrl+C or --stop{C.N}\n")

    clicks = 0
    scans = 0
    ide_ok = False

    while True:
        scans += 1
        r = scan(args.buttons, args.dry_run, args.verbose)

        if r >= 0 and not ide_ok:
            log("IDE detected, monitoring...", "ok")
            ide_ok = True
        elif r == -1 and ide_ok:
            log("IDE disconnected, waiting...", "warn")
            ide_ok = False

        if r == 1:
            clicks += 1
            log(f"✅ Auto-clicked! (total: {clicks})", "ok")
            time.sleep(1.5)  # Wait for dialog to close

        if args.once:
            break

        if scans % 60 == 0:
            log(f"Still monitoring... scans={scans}, clicks={clicks}", "dbg")

        time.sleep(args.interval)

    log(f"Done. scans={scans} clicks={clicks}")
    cleanup_pid()


if __name__ == "__main__":
    main()
 
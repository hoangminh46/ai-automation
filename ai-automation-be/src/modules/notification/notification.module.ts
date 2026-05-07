import { Module, Global } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';

/**
 * Global module — cho phép mọi service inject NotificationGateway
 * mà không cần import NotificationModule vào từng module.
 */
@Global()
@Module({
  providers: [NotificationGateway],
  exports: [NotificationGateway],
})
export class NotificationModule {}

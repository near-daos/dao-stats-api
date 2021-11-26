import { TenantRequest } from './tenant-request.dto';

export class MetricRequest extends TenantRequest {
  from: number;
  to: number;
}

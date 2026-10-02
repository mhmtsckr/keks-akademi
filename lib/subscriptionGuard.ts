import { AuthError } from './apiGuard';
import { requireRole } from './auth';
import { getActiveSubscription } from './subscriptionAccess';

export async function requireSubscribedRole(roles:Array<'COACH'|'STUDENT'>){
 const user=await requireRole(roles);
 const active=await getActiveSubscription(user.id);
 if(!active)throw new AuthError(403,'Aktif KEKS aboneliği gerekiyor.');
 if(!roles.includes(active.plan.audience as 'COACH'|'STUDENT'))throw new AuthError(403,'Abonelik türü bu alan için uygun değil.');
 return {...user,activeSubscription:active};
}

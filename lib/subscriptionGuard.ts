import { requireRole } from './auth';
import { getActiveSubscription } from './subscriptionAccess';

// Pilot kullanımı: kimlik doğrulama ve rol kontrolü korunur; üyelik satın alma şartı aranmaz.
// Eski abonelik verileri veri bütünlüğü için okunabilir kalır.
export async function requireSubscribedRole(roles:Array<'COACH'|'STUDENT'>){
  const user=await requireRole(roles);
  const active=await getActiveSubscription(user.id);
  return {...user,activeSubscription:active};
}

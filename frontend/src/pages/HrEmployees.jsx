import Staff from './Staff';
import { usePageTitle } from '../context/PageTitleContext';

/** Full-page employee management for HR (and admins/managers with staff access). */
export default function HrEmployees() {
  usePageTitle('Employees');
  return <Staff />;
}

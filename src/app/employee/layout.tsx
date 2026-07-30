import EmployeeShell from './EmployeeShell';

export default function EmployeeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <EmployeeShell>{children}</EmployeeShell>;
}

type Props = {
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
};

export default function Badge({ children, variant = "neutral" }: Props) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

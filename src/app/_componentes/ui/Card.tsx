type Props = React.HTMLAttributes<HTMLDivElement> & {
  glow?: boolean;
};

export default function Card({ glow = false, className = "", style, ...rest }: Props) {
  const classes = ["card", glow ? "card-glow" : "", className].filter(Boolean).join(" ");
  return <div className={classes} style={{ padding: 22, ...style }} {...rest} />;
}

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export function Field({ label, error, hint, id, className = "", ...rest }: Props) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label className="field" htmlFor={inputId}>
      <span className="field-label">{label}</span>
      <input id={inputId} className={`field-input ${className}`} data-error={!!error} {...rest} />
      {error && <span className="field-error">{error}</span>}
      {!error && hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
};

export function SelectField({ label, hint, id, className = "", children, ...rest }: SelectProps) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label className="field" htmlFor={selectId}>
      <span className="field-label">{label}</span>
      <select id={selectId} className={`field-input ${className}`} {...rest}>
        {children}
      </select>
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

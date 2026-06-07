import './FormField.css'

export default function FormField({
  id,
  label,
  hint,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  wide = false,
  as = 'input',
  rows = 3,
  inputMode,
}) {
  const InputTag = as

  return (
    <div className={`field${wide ? ' field--wide' : ''}`}>
      <label htmlFor={id}>
        <span className="label-text">{label}</span>
        {hint ? <span className="label-hint">{hint}</span> : null}
      </label>
      <InputTag
        id={id}
        name={id}
        type={as === 'input' ? type : undefined}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        rows={as === 'textarea' ? rows : undefined}
        inputMode={inputMode}
      />
    </div>
  )
}

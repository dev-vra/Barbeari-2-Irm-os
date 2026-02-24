import type { UseFormRegisterReturn } from 'react-hook-form'

interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  /** Pure function that receives current raw input and returns masked string */
  mask: (value: string) => string
  /** Result of react-hook-form's register() call */
  registration: UseFormRegisterReturn
}

/**
 * Masked text input compatible with React Hook Form.
 * Applies `mask` on every keystroke while forwarding the masked value to RHF.
 */
export default function MaskedInput({ mask, registration, ...props }: MaskedInputProps) {
  const { ref, onChange, ...rest } = registration

  return (
    <input
      {...rest}
      {...props}
      ref={ref}
      onChange={(e) => {
        e.target.value = mask(e.target.value)
        onChange(e)
      }}
    />
  )
}

"use client"

import * as React from "react"
import { FormInput, type FormInputProps } from "@/components/ui/form-input"

export interface InputFormProps extends FormInputProps {}

export const InputForm = React.forwardRef<HTMLInputElement, InputFormProps>(
  (props, ref) => {
    return <FormInput ref={ref} {...props} />
  }
)

InputForm.displayName = "InputForm"

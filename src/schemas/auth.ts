import { z } from 'zod'
export const loginSchema = z.object({ email: z.string().email('E-mail inválido'), password: z.string().min(1, 'Informe a senha') })
export const schoolSignupSchema = z.object({ name: z.string().min(3, 'Informe o nome'), responsibleName: z.string().min(3, 'Informe o responsável'), email: z.string().email('E-mail inválido'), password: z.string().min(8, 'Mínimo de 8 caracteres'), confirm: z.string() })
  .refine(d => d.password === d.confirm, { path: ['confirm'], message: 'As senhas não coincidem' })
export type LoginForm = z.infer<typeof loginSchema>; export type SchoolSignupForm = z.infer<typeof schoolSignupSchema>

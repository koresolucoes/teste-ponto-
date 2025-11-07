export interface Funcionario {
  id: string;
  name: string;
  role_id: string;
  user_id: string;
  created_at: string;
  roles: { name: string };
  photo_url?: string | null;
}

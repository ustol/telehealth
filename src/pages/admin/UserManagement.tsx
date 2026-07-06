import { X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInstitutions, useRoles, useUserMutations, useUsers } from "@/hooks/useUsers";

export default function UserManagement() {
  const { data: users, isLoading } = useUsers();
  const { data: institutions } = useInstitutions();
  const { data: roles } = useRoles();
  const { setInstitution, setActive, addRole, removeRole } = useUserMutations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Assign institutions and roles. New accounts are created by inviting a user via the Supabase dashboard —
          they appear here automatically once they sign in for the first time.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Users</CardTitle>
          <CardDescription>{users?.length ?? 0} account(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead className="w-24">Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <p className="font-medium">{u.full_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={u.institution_id ?? ""}
                        onValueChange={(v) => setInstitution.mutate({ userId: u.id, institutionId: v || null })}
                      >
                        <SelectTrigger className="w-44"><SelectValue placeholder="None" /></SelectTrigger>
                        <SelectContent>
                          {institutions?.map((i) => (
                            <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {u.roles.map((r) => (
                          <Badge key={r.id} variant="secondary" className="gap-1 pr-1">
                            {r.name}
                            <button onClick={() => removeRole.mutate({ userId: u.id, roleId: r.id })}>
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                        <Select
                          value=""
                          onValueChange={(v) => addRole.mutate({ userId: u.id, roleId: Number(v) })}
                        >
                          <SelectTrigger className="w-36 h-7 text-xs"><SelectValue placeholder="+ Add role" /></SelectTrigger>
                          <SelectContent>
                            {roles
                              ?.filter((r) => !u.roles.some((ur) => ur.id === r.id))
                              .map((r) => (
                                <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={u.is_active}
                        onCheckedChange={(v) => setActive.mutate({ userId: u.id, isActive: Boolean(v) })}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRIES } from "@/lib/countries";
import type { User } from "@shared/schema";

const createUserFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(2, "Full name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "manager", "user"]),
  isActive: z.boolean(),
  assignedCountries: z.array(z.string()).min(1, "At least one country must be assigned"),
});

const updateUserFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(2, "Full name is required"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  role: z.enum(["admin", "manager", "user"]),
  isActive: z.boolean(),
  assignedCountries: z.array(z.string()).min(1, "At least one country must be assigned"),
});

export type UserFormData = z.infer<typeof createUserFormSchema>;

interface UserFormProps {
  initialData?: User;
  onSubmit: (data: UserFormData) => void;
  isLoading?: boolean;
  onCancel: () => void;
}

export function UserForm({ initialData, onSubmit, isLoading, onCancel }: UserFormProps) {
  const isEditing = !!initialData;
  
  const form = useForm<UserFormData>({
    resolver: zodResolver(isEditing ? updateUserFormSchema : createUserFormSchema),
    defaultValues: {
      username: initialData?.username || "",
      email: initialData?.email || "",
      fullName: initialData?.fullName || "",
      password: "",
      role: (initialData?.role as any) || "user",
      isActive: initialData?.isActive ?? true,
      assignedCountries: initialData?.assignedCountries || [],
    },
  });
  
  const handleFormSubmit = (data: UserFormData) => {
    const submitData = { ...data };
    if (isEditing && !data.password) {
      delete (submitData as any).password;
    }
    onSubmit(submitData);
  };

  const handleSelectAll = () => {
    form.setValue("assignedCountries", COUNTRIES.map(c => c.code));
  };

  const handleClearAll = () => {
    form.setValue("assignedCountries", []);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="John Doe" 
                    {...field} 
                    data-testid="input-fullname"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="johndoe" 
                    {...field} 
                    data-testid="input-username"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="john@example.com" 
                    {...field} 
                    data-testid="input-email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{isEditing ? "New Password (optional)" : "Password"}</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder={isEditing ? "Leave empty to keep current" : "Enter password"} 
                    {...field} 
                    data-testid="input-password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid="checkbox-active"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Active Account</FormLabel>
                <FormDescription>
                  User can access the CRM system when active
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="assignedCountries"
          render={() => (
            <FormItem>
              <div className="flex items-center justify-between mb-4">
                <FormLabel className="text-base">Assigned Countries</FormLabel>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleSelectAll}
                    data-testid="button-select-all"
                  >
                    Select All
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleClearAll}
                    data-testid="button-clear-all"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
              <FormDescription className="mb-4">
                Select the countries this user can access customer data from
              </FormDescription>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {COUNTRIES.map((country) => (
                  <FormField
                    key={country.code}
                    control={form.control}
                    name="assignedCountries"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={country.code}
                          className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 hover-elevate"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(country.code)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, country.code])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== country.code
                                      )
                                    );
                              }}
                              data-testid={`checkbox-country-${country.code}`}
                            />
                          </FormControl>
                          <FormLabel className="flex items-center gap-2 font-normal cursor-pointer">
                            <span className="text-lg">{country.flag}</span>
                            <span>{country.name}</span>
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            data-testid="button-submit"
          >
            {isLoading ? "Saving..." : initialData ? "Update User" : "Create User"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

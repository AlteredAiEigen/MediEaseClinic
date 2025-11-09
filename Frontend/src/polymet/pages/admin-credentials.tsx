import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  SearchIcon,
  UserPlusIcon,
  MoreVerticalIcon,
  EditIcon,
  TrashIcon,
  MailIcon,
  KeyIcon,
  ShieldIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  UserIcon,
  Loader2,
} from "lucide-react";
import { get, post, del, put } from "@/lib/api-client";
import { useAuth } from "@/context/auth-context";

// Custom hook for debounced search
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  fullName?: string; // Made optional as API might not always provide it
  email: string;
  role: "doctor" | "receptionist" | "admin";
  isActive: boolean;
  lastLogin?: string | null;
  createdAt: string;
  speciality?: string | null;
  licenseNumber?: string | null;
  experience?: number;
  profileImage?: string | null;
}

export function AdminCredentials() {
  const { user: currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 150); // 150ms debounce
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "doctor" as "doctor" | "receptionist",
    password: "",
    phone: "",
    speciality: "",
    licenseNumber: "",
    experience: 0,
  });

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get all users (admin can see all users in their clinic)
        const response = await get<User[]>("/api/admin/users");

        if (response.success && Array.isArray(response.data)) {
          setUsers(response.data);
        } else {
          setUsers([]);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load users";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser]);

  // Filter users - exclude admin users from the list
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Don't show admin users to other admins
      if (user.role === "admin") {
        return false;
      }

      const searchTerm = debouncedSearchQuery.trim().toLowerCase();
      const matchesSearch =
        searchTerm === "" ||
        user.fullName?.toLowerCase().includes(searchTerm) ||
        user.firstName?.toLowerCase().includes(searchTerm) ||
        user.lastName?.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm);
      const matchesRole = filterRole === "all" || user.role === filterRole;
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && user.isActive) ||
        (filterStatus === "inactive" && !user.isActive);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, debouncedSearchQuery, filterRole, filterStatus]);

  const handleCreateUser = async () => {
    if (!newUser.firstName.trim() || !newUser.lastName.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const userData = {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        phone: newUser.phone || undefined,
        speciality: newUser.role === "doctor" ? newUser.speciality : undefined,
        licenseNumber: newUser.role === "doctor" ? newUser.licenseNumber : undefined,
        experience: newUser.role === "doctor" ? newUser.experience : undefined,
      };

      const response = await post<{ user: User }>("/api/admin/users", userData);

      if (response.success && response.data?.user) {
        setUsers((prev) => [...prev, response.data!.user]);
        setCreateDialogOpen(false);
        setNewUser({
          firstName: "",
          lastName: "",
          email: "",
          role: "doctor",
          password: "",
          phone: "",
          speciality: "",
          licenseNumber: "",
          experience: 0,
        });
      } else {
        setError(response.message ?? "Failed to create user");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create user";
      setError(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateUser = () => {
    if (!selectedUser) return;

    const fullName =
      selectedUser.fullName ||
      `${selectedUser.firstName} ${selectedUser.lastName}`.trim();
    const [firstNameUpdate, ...rest] = fullName.trim().split(" ");
    const lastNameUpdate = rest.length > 0 ? rest.join(" ") : firstNameUpdate;

    setUsers(
      users.map((u) =>
        u._id === selectedUser._id
          ? {
              ...u,
              firstName: firstNameUpdate,
              lastName: lastNameUpdate,
              fullName,
              email: selectedUser.email,
            }
          : u
      )
    );
    setEditDialogOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await del(`/api/admin/users/${selectedUser._id}`);

      if (response.success) {
        setUsers(users.filter((u) => u._id !== selectedUser._id));
        setDeleteDialogOpen(false);
        setSelectedUser(null);
      } else {
        setError(response.message ?? "Failed to delete user");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete user";
      setError(message);
    }
  };

  const handleSendPasswordReset = () => {
    // Simulate sending password reset email
    setResetPasswordDialogOpen(false);
    setSelectedUser(null);
  };

  const handleToggleStatus = async (userId: string) => {
    const user = users.find(u => u._id === userId);
    if (!user) return;

    try {
      const response = await put(`/api/admin/users/${userId}`, {
        isActive: !user.isActive
      });

      if (response.success) {
        setUsers(users.map((u) =>
          u._id === userId
            ? { ...u, isActive: !u.isActive }
            : u
        ));
      }
    } catch (err) {
      console.error('Failed to toggle user status:', err);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400";
      case "doctor":
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400";
      case "receptionist":
        return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400";
      default:
        return "";
    }
  };

  const staffUsers = useMemo(
    () => users.filter((user) => user.role !== "admin"),
    [users]
  );

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-lg bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                  Total Users
                </p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent mt-1">
                  {staffUsers.length}
                </h3>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/50">
                <ShieldIcon className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  Active Users
                </p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent mt-1">
                  {staffUsers.filter((u) => u.isActive).length}
                </h3>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                <CheckCircleIcon className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  Doctors
                </p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent mt-1">
                  {users.filter((u) => u.role === "doctor").length}
                </h3>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/50">
                <KeyIcon className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">
                  Staff
                </p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent mt-1">
                  {users.filter((u) => u.role === "receptionist").length}
                </h3>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/50">
                <UserPlusIcon className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldIcon className="w-5 h-5 text-[#00C4B3]" />
              User Credentials Management
            </CardTitle>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#00C4B3] to-[#10b981] hover:from-[#009C8F] hover:to-[#059669] text-white">
                <UserPlusIcon className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user account with login credentials
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="First name"
                      value={newUser.firstName}
                      onChange={(e) =>
                        setNewUser({ ...newUser, firstName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Last name"
                      value={newUser.lastName}
                      onChange={(e) =>
                        setNewUser({ ...newUser, lastName: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@mediease.com"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value: "doctor" | "receptionist") =>
                        setNewUser({ ...newUser, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="receptionist">Receptionist</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      placeholder="+1-555-XXXX"
                      value={newUser.phone}
                      onChange={(e) =>
                        setNewUser({ ...newUser, phone: e.target.value })
                      }
                    />
                  </div>
                </div>

                {newUser.role === "doctor" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="speciality">Speciality</Label>
                      <Input
                        id="speciality"
                        placeholder="e.g., Cardiology, Pediatrics"
                        value={newUser.speciality}
                        onChange={(e) =>
                          setNewUser({ ...newUser, speciality: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="licenseNumber">License Number</Label>
                        <Input
                          id="licenseNumber"
                          placeholder="License number"
                          value={newUser.licenseNumber}
                          onChange={(e) =>
                            setNewUser({ ...newUser, licenseNumber: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="experience">Experience (years)</Label>
                        <Input
                          id="experience"
                          type="number"
                          placeholder="0"
                          value={newUser.experience}
                          onChange={(e) =>
                            setNewUser({ ...newUser, experience: parseInt(e.target.value) || 0 })
                          }
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Initial Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter initial password"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                  />

                  <p className="text-xs text-muted-foreground">
                    User will be prompted to change password on first login
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateUser}
                  disabled={
                    !newUser.firstName.trim() || !newUser.lastName.trim() || !newUser.email.trim() || !newUser.password.trim() || isCreating
                  }
                  className="bg-gradient-to-r from-[#00C4B3] to-[#10b981] hover:from-[#009C8F] hover:to-[#059669] text-white"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create User"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2">
                <AlertCircleIcon className="w-4 h-4 text-red-500" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />

              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="doctor">Doctors</SelectItem>
                <SelectItem value="receptionist">Receptionists</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">Loading users...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <UserIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>No users found</p>
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && filteredUsers.length > 0 && filteredUsers.map((user) => (
                    <TableRow key={user._id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 border-2 border-border">
                            <AvatarFallback className="bg-gradient-to-br from-[#00C4B3] to-[#10b981] text-white">
                              {(user.fullName || `${user.firstName} ${user.lastName}`)
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">
                              {user.fullName || `${user.firstName} ${user.lastName}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ID: {user._id.slice(-8)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getRoleBadgeColor(user.role)}
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={user.isActive ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400"}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVerticalIcon className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[200px]">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem asChild>
                              <Link to={`/admin/user-profile/${user._id}`}>
                                <UserIcon className="w-4 h-4 mr-2" />
                                View Profile
                              </Link>
                            </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setEditDialogOpen(true);
                            }}
                          >
                            <EditIcon className="w-4 h-4 mr-2" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setResetPasswordDialogOpen(true);
                            }}
                          >
                            <MailIcon className="w-4 h-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(user._id)}
                          >
                            {user.isActive ? (
                              <>
                                <XCircleIcon className="w-4 h-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircleIcon className="w-4 h-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            className="text-red-600 dark:text-red-400"
                            onClick={() => {
                              setSelectedUser(user);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <TrashIcon className="w-4 h-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User Details</DialogTitle>
            <DialogDescription>
              Update user information and credentials
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={
                    selectedUser.fullName ||
                    `${selectedUser.firstName} ${selectedUser.lastName}`.trim()
                  }
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      fullName: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, email: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateUser}
              className="bg-gradient-to-r from-[#00C4B3] to-[#10b981] hover:from-[#009C8F] hover:to-[#059669] text-white"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400">
              Delete User Account
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user account? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Avatar className="w-12 h-12 border-2 border-border">
                  <AvatarImage
                    src={selectedUser.profileImage ?? undefined}
                    alt={
                      selectedUser.fullName ||
                      `${selectedUser.firstName} ${selectedUser.lastName}`
                    }
                  />

                  <AvatarFallback className="bg-gradient-to-br from-[#00C4B3] to-[#10b981] text-white">
                    {(selectedUser.fullName || `${selectedUser.firstName} ${selectedUser.lastName}`)
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">
                    {selectedUser.fullName || `${selectedUser.firstName} ${selectedUser.lastName}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.email}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={resetPasswordDialogOpen}
        onOpenChange={setResetPasswordDialogOpen}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Send Password Reset Email</DialogTitle>
            <DialogDescription>
              Send a password reset link to the user's email address
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                  <MailIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {selectedUser.fullName ||
                      `${selectedUser.firstName} ${selectedUser.lastName}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.email}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                A secure password reset link will be sent to the user's email
                address. The link will expire in 24 hours.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetPasswordDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendPasswordReset}
              className="bg-gradient-to-r from-[#00C4B3] to-[#10b981] hover:from-[#009C8F] hover:to-[#059669] text-white"
            >
              <MailIcon className="w-4 h-4 mr-2" />
              Send Reset Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

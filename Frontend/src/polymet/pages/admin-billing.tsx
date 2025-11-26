import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { get, post, put, del } from "@/lib/api-client";
import {
  DollarSignIcon,
  PlusIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";

interface BillingItem {
  _id: string;
  category: "appointmentType" | "test";
  key: string;
  label: string;
  price: number;
  currency: string;
  isActive: boolean;
}

interface BillingResponse {
  items: BillingItem[];
}

const defaultFormState: Omit<BillingItem, "_id"> = {
  category: "appointmentType",
  key: "",
  label: "",
  price: 0,
  currency: "INR",
  isActive: true,
};

export function AdminBilling() {
  const [items, setItems] = useState<BillingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BillingItem | null>(null);
  const [formState, setFormState] = useState(defaultFormState);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await get<BillingResponse>("/api/admin/billing-items");
      if (response.success && response.data?.items) {
        setItems(response.data.items);
      } else {
        setItems([]);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load billing items";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const openCreateDialog = () => {
    setEditingItem(null);
    setFormState(defaultFormState);
    setDialogOpen(true);
  };

  const openEditDialog = (item: BillingItem) => {
    setEditingItem(item);
    setFormState({
      category: item.category,
      key: item.key,
      label: item.label,
      price: item.price,
      currency: item.currency,
      isActive: item.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formState.key.trim() || !formState.label.trim()) {
      setError("Key and label are required.");
      return;
    }

    try {
      setError(null);
      if (editingItem) {
        await put(`/api/admin/billing-items/${editingItem._id}`, formState);
      } else {
        await post("/api/admin/billing-items", formState);
      }
      setDialogOpen(false);
      await loadItems();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save billing item";
      setError(message);
    }
  };

  const handleDelete = async (item: BillingItem) => {
    if (!window.confirm(`Delete pricing for "${item.label}"?`)) return;
    try {
      await del(`/api/admin/billing-items/${item._id}`);
      await loadItems();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete billing item";
      setError(message);
    }
  };

  const appointmentTypeItems = items.filter(
    (item) => item.category === "appointmentType"
  );

  const testItems = items.filter((item) => item.category === "test");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <DollarSignIcon className="w-5 h-5 text-[#00C4B3]" />
            Billing & Pricing
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define how much each appointment type and test costs. These prices
            are used to calculate revenue in the dashboard.
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-gradient-to-r from-[#00C4B3] to-[#10b981] text-white"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Pricing
        </Button>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Appointment Type Pricing
              <Badge variant="outline" className="text-xs">
                {appointmentTypeItems.length} types
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : appointmentTypeItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No appointment pricing defined yet.
              </p>
            ) : (
              <div className="divide-y divide-border rounded-md border border-border/60">
                {appointmentTypeItems.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between px-3 py-2"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Key: {item.key}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">
                        {item.currency} {item.price.toFixed(2)}
                      </span>
                      <Badge
                        variant={item.isActive ? "outline" : "secondary"}
                        className="text-[10px]"
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => openEditDialog(item)}
                      >
                        <PencilIcon className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2Icon className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Test & Lab Pricing
              <Badge variant="outline" className="text-xs">
                {testItems.length} items
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : testItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No test pricing defined yet.
              </p>
            ) : (
              <div className="divide-y divide-border rounded-md border border-border/60">
                {testItems.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between px-3 py-2"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Key: {item.key}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">
                        {item.currency} {item.price.toFixed(2)}
                      </span>
                      <Badge
                        variant={item.isActive ? "outline" : "secondary"}
                        className="text-[10px]"
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => openEditDialog(item)}
                      >
                        <PencilIcon className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2Icon className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Pricing" : "Add Pricing"}
            </DialogTitle>
            <DialogDescription>
              Configure how much this appointment type or test should cost.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formState.category}
                onValueChange={(value: "appointmentType" | "test") =>
                  setFormState((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appointmentType">
                    Appointment Type
                  </SelectItem>
                  <SelectItem value="test">Test / Lab Item</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Key (used by system)</Label>
                <Input
                  value={formState.key}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      key: e.target.value,
                    }))
                  }
                  placeholder="consultation"
                />
              </div>
              <div className="space-y-2">
                <Label>Label (shown to users)</Label>
                <Input
                  value={formState.label}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      label: e.target.value,
                    }))
                  }
                  placeholder="Consultation"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Price</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={formState.price}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      price: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Input
                  value={formState.currency}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      currency: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-[#00C4B3] to-[#10b981] text-white"
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}



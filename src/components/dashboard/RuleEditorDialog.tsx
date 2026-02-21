import { useState, useEffect } from "react";
import { Rule, useDashboard } from "@/context/DashboardContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCategories } from "@/data/mockProducts";
import { useToast } from "@/hooks/use-toast";

interface Props {
  rule: Rule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fields = [
  { value: "tags", label: "Tags" },
  { value: "margin", label: "Margin" },
  { value: "price", label: "Price" },
  { value: "category", label: "Category" },
  { value: "availability", label: "Availability" },
];

const conditions: Record<string, { value: string; label: string }[]> = {
  tags: [{ value: "contains", label: "contains" }],
  margin: [{ value: "greater_than", label: "greater than" }, { value: "less_than", label: "less than" }],
  price: [{ value: "greater_than", label: "greater than" }, { value: "less_than", label: "less than" }],
  category: [{ value: "equals", label: "equals" }],
  availability: [{ value: "equals", label: "equals" }],
};

const actions = [
  { value: "boost", label: "Boost" },
  { value: "demote", label: "Demote" },
  { value: "exclude", label: "Exclude" },
];

export function RuleEditorDialog({ rule, open, onOpenChange }: Props) {
  const { setRules } = useDashboard();
  const { toast } = useToast();
  const isEditing = !!rule;

  const [name, setName] = useState("");
  const [field, setField] = useState("tags");
  const [condition, setCondition] = useState("contains");
  const [value, setValue] = useState("");
  const [action, setAction] = useState("boost");
  const [amount, setAmount] = useState(2);

  useEffect(() => {
    if (rule) {
      setName(rule.name);
      setField(rule.field);
      setCondition(rule.condition);
      setValue(rule.value);
      setAction(rule.action);
      setAmount(rule.amount);
    } else {
      setName("");
      setField("tags");
      setCondition("contains");
      setValue("");
      setAction("boost");
      setAmount(2);
    }
  }, [rule, open]);

  const handleSave = () => {
    if (!name.trim() || !value.trim()) return;
    const newRule: Rule = {
      id: rule?.id || `r_${Date.now()}`,
      name: name.trim(),
      field, condition, value: value.trim(),
      action,
      amount: action === "exclude" ? 0 : action === "demote" ? -Math.abs(amount) : Math.abs(amount),
    };

    setRules((prev) =>
      isEditing ? prev.map((r) => (r.id === rule!.id ? newRule : r)) : [...prev, newRule]
    );
    toast({ title: isEditing ? "Rule updated" : "Rule created", description: newRule.name });
    onOpenChange(false);
  };

  const fieldConditions = conditions[field] || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Rule" : "Create Custom Rule"}</DialogTitle>
          <DialogDescription>Define a merchandising rule with conditions and actions.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Rule name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Boost summer items" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Field</label>
              <Select value={field} onValueChange={(v) => { setField(v); setCondition(conditions[v]?.[0]?.value || ""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {fields.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Condition</label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {fieldConditions.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Value</label>
            {field === "category" ? (
              <Select value={value} onValueChange={setValue}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {getCategories().map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : field === "availability" ? (
              <Select value={value} onValueChange={setValue}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_stock">In stock</SelectItem>
                  <SelectItem value="low_stock">Low stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of stock</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={field === "tags" ? "e.g. bestseller" : "e.g. 50"} />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Action</label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {actions.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {action !== "exclude" && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Amount: {amount}</label>
                <Slider value={[Math.abs(amount)]} onValueChange={([v]) => setAmount(v)} min={1} max={5} step={1} />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim() || !value.trim()}>
            {isEditing ? "Update rule" : "Create rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

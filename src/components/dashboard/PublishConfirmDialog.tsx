import { useDashboard } from "@/context/DashboardContext";
import { mockProducts } from "@/data/mockProducts";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function PublishConfirmDialog({ open, onOpenChange, onConfirm }: Props) {
  const { products, rules } = useDashboard();

  const changedProducts = products.filter((p, i) => {
    const original = mockProducts[i];
    if (!original) return true;
    return p.boostScore !== original.boostScore || p.included !== original.included || JSON.stringify(p.tags) !== JSON.stringify(original.tags);
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Publish changes?</AlertDialogTitle>
          <AlertDialogDescription>
            This will push your current configuration to your live storefront.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 my-2">
          <div className="rounded-lg border border-border/50 p-3 space-y-1.5">
            <h4 className="text-sm font-semibold">Change summary</h4>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{changedProducts.length}</span> products modified
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{rules.length}</span> active rules
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{products.filter((p) => p.included).length}</span> products included
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Publish</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

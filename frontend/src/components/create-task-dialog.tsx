// components/CreateTaskDialog.tsx
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { getProjectMembers } from "@/lib/api";

interface CreateTaskDialogProps {
  projectId: number;
  onSuccess: (data: any) => void;
  children: React.ReactNode;
}

export function CreateTaskDialog({ projectId, onSuccess, children }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [dueDate, setDueDate] = useState("");

  const { data: members } = useQuery({
    queryKey: ["projectMembers", projectId],
    queryFn: () => getProjectMembers(projectId),
    enabled: open,
  });

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSuccess({
      title,
      description,
      priority,
      assigneeId: assigneeId ? parseInt(assigneeId) : null,
      dueDate: dueDate || null,
    });
    setOpen(false);
    // Reset form
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setAssigneeId("");
    setDueDate("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>إضافة مهمة جديدة</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label>العنوان *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>الوصف</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <Label>الأولوية</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">منخفضة</SelectItem>
                <SelectItem value="MEDIUM">متوسطة</SelectItem>
                <SelectItem value="HIGH">عالية</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>المسند</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger>
                <SelectValue placeholder="غير معين" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">غير معين</SelectItem>
                {members?.map((m) => (
                  <SelectItem key={m.id} value={m.id.toString()}>
                    {m.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>تاريخ الاستحقاق</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
          <Button onClick={handleSubmit}>إنشاء</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
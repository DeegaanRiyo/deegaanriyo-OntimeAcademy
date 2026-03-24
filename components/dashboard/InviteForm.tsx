"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  role:  z.enum(["admin", "teacher"]),
});

type Fields = z.infer<typeof schema>;

export default function InviteForm() {
  const router  = useRouter();
  const [open,  setOpen]  = useState(false);
  const [done,  setDone]  = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<Fields>({ resolver: zodResolver(schema), defaultValues: { role: "admin" } });

  const onSubmit = async (data: Fields) => {
    setError(null);
    const res = await fetch("/api/auth/invite", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Failed to send invite. Try again.");
      return;
    }

    setDone(true);
    reset();
    setTimeout(() => {
      setDone(false);
      setOpen(false);
      router.refresh();
    }, 2000);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-primary inline-flex items-center gap-2 text-[0.82rem]"
      >
        <i className="fas fa-user-plus" />
        Invite Admin / Teacher
      </button>
    );
  }

  return (
    <div className="bg-white border border-border rounded-[10px] shadow-[0_8px_32px_rgba(0,0,0,0.09)] p-6 w-[320px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-dark text-[0.92rem]">Invite team member</h3>
        <button onClick={() => { setOpen(false); setDone(false); setError(null); reset(); }}
          className="text-muted hover:text-dark transition-colors text-sm">
          <i className="fas fa-times" />
        </button>
      </div>

      {done ? (
        <div className="text-center py-4">
          <i className="fas fa-check-circle text-green-500 text-2xl mb-2 block" />
          <p className="text-[0.84rem] font-semibold text-dark">Invite sent!</p>
          <p className="text-muted text-[0.76rem] mt-1">They'll receive an email to set up their account.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
          {error && (
            <p className="text-red-600 text-[0.76rem] bg-red-50 border border-red-200 px-3 py-2 rounded">
              {error}
            </p>
          )}

          <div>
            <label className="block text-[0.68rem] font-semibold uppercase tracking-wider text-muted mb-1">
              Email
            </label>
            <input type="email" placeholder="name@example.com" className="form-input" {...register("email")} />
            {errors.email && <p className="text-red-500 text-[0.7rem] mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-[0.68rem] font-semibold uppercase tracking-wider text-muted mb-1">
              Role
            </label>
            <select className="form-input" {...register("role")}>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-2.5 text-[0.82rem] flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting
              ? <><i className="fas fa-circle-notch fa-spin" /> Sending…</>
              : <><i className="fas fa-paper-plane" /> Send Invite</>
            }
          </button>
        </form>
      )}
    </div>
  );
}

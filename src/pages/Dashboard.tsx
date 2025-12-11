import type React from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Papa from "papaparse";
import type { ParseResult } from "papaparse";
import { auth } from "../auth/AuthContext";
import type { Tenant } from "../types/tenant";
import TenantTable from "../components/dashboard/TenantTable";
import TenantForm from "../components/dashboard/TenantForm";
import NoticeHistory from "../components/dashboard/NoticeHistory";
import { tenantService } from "../services/tenantService";
import { paymentService } from "../services/paymentService";



const getCurrentPeriod = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const Dashboard: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [email, setEmail] = useState("");
  const [rent, setRent] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [lateFeeFlat, setLateFeeFlat] = useState("");
  const [loading, setLoading] = useState(false);

  const [paidTenantIds, setPaidTenantIds] = useState<string[]>([]);

  const navigate = useNavigate();
  const period = getCurrentPeriod();

  // Load tenants + payments for the current period
  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const [tenantItems, paymentItems] = await Promise.all([
          tenantService.getTenantsForOwner(user.uid),
          paymentService.getPaymentsForOwnerForPeriod(user.uid, period),
        ]);

        setTenants(tenantItems);
        setPaidTenantIds(paymentItems.map((p) => p.tenantId));
      } catch (err) {
        console.error("Failed to load tenants/payments", err);
      }
    };

    void fetchData();
  }, [period]);

  const handleAddTenant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name || !email || !rent || !dueDay) return;

    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      const created = await tenantService.createTenant(user.uid, {
        name,
        unit,
        email,
        rent: Number(rent),
        dueDay: Number(dueDay),
        lateFeeFlat: lateFeeFlat ? Number(lateFeeFlat) : 0,
      });

      setTenants((prev) => [...prev, created]);

      setName("");
      setUnit("");
      setEmail("");
      setRent("");
      setDueDay("");
      setLateFeeFlat("");
    } catch (err) {
      console.error("Failed to create tenant", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCSVUpload = (file: File | undefined) => {
    if (!file) return;

    const user = auth.currentUser;
    if (!user) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: ParseResult<any>) => {
        const rows = results.data as any[];

        try {
          for (const row of rows) {
            if (!row.name || !row.email || !row.rent || !row.dueDay) continue;

            await tenantService.createTenant(user.uid, {
              name: row.name,
              unit: row.unit || "",
              email: row.email,
              rent: Number(row.rent),
              dueDay: Number(row.dueDay),
              lateFeeFlat: Number(row.lateFeeFlat || 0),
            });
          }

          const items = await tenantService.getTenantsForOwner(user.uid);
          setTenants(items);
        } catch (err) {
          console.error("Failed to import tenants from CSV", err);
        }
      },
    });
  };
  
  const handleViewLedger = (tenant: Tenant) => {
  navigate(`/tenant/${tenant.id}`);
};


  const isPaid = (tenant: Tenant): boolean => {
    return paidTenantIds.includes(tenant.id);
  };

  const isLate = (tenant: Tenant): boolean => {
    if (isPaid(tenant)) return false;

    const today = new Date();
    const todayDay = today.getDate();
    return todayDay > tenant.dueDay;
  };

  const handleGenerateNotice = (tenant: Tenant) => {
    navigate(`/notice/${tenant.id}`);
  };

  const handleMarkPaid = async (tenant: Tenant) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const amount = tenant.rent; // simple: full rent
      await paymentService.logPayment({
        ownerId: user.uid,
        tenantId: tenant.id,
        amount,
        period,
      });

      setPaidTenantIds((prev) =>
        prev.includes(tenant.id) ? prev : [...prev, tenant.id]
      );
    } catch (err) {
      console.error("Failed to log payment", err);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#e5e7eb",
        padding: "2rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h1 style={{ fontSize: "2rem", marginBottom: 0 }}>RentWarn Dashboard</h1>
        <div style={{ display: "flex", gap: "1rem", fontSize: "0.9rem" }}>
          <Link to="/settings" style={{ color: "#9ca3af" }}>
            Settings
          </Link>
          <Link to="/billing" style={{ color: "#4ade80" }}>
            Billing
          </Link>
        </div>
      </div>

      <p style={{ marginBottom: "1.5rem", color: "#9ca3af" }}>
        Manage tenants, track who has paid this period, see who is likely late,
        and generate late rent notices.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: "1.5rem",
          alignItems: "flex-start",
        }}
      >
        <TenantTable
  tenants={tenants}
  isLate={isLate}
  isPaid={isPaid}
  onGenerateNotice={handleGenerateNotice}
  onMarkPaid={handleMarkPaid}
  onViewLedger={handleViewLedger}
/>


        <TenantForm
          name={name}
          unit={unit}
          email={email}
          rent={rent}
          dueDay={dueDay}
          lateFeeFlat={lateFeeFlat}
          loading={loading}
          onSubmit={handleAddTenant}
          onNameChange={setName}
          onUnitChange={setUnit}
          onEmailChange={setEmail}
          onRentChange={setRent}
          onDueDayChange={setDueDay}
          onLateFeeChange={setLateFeeFlat}
          onCSVUpload={handleCSVUpload}
        />
      </div>

      <NoticeHistory />
    </div>
  );
};

export default Dashboard;

import "dotenv/config";
import { createDatabaseClient } from "./client.js";
import { approvals, properties, serviceProviders, ticketMessages, tickets, units, users } from "./schema.js";

const ids = {
  tenant: "00000000-0000-4000-8000-000000000001",
  manager: "00000000-0000-4000-8000-000000000002",
  owner: "00000000-0000-4000-8000-000000000003",
  property: "00000000-0000-4000-8000-000000000010",
  unit: "00000000-0000-4000-8000-000000000011",
  plumbing: "00000000-0000-4000-8000-000000000020",
  heating: "00000000-0000-4000-8000-000000000021",
  electricity: "00000000-0000-4000-8000-000000000022",
  heatingTicket: "00000000-0000-4000-8000-000000000030",
  leakTicket: "00000000-0000-4000-8000-000000000031",
  internetTicket: "00000000-0000-4000-8000-000000000032",
  approval: "00000000-0000-4000-8000-000000000040"
};

async function seed() {
  const { client, db } = createDatabaseClient();

  try {
    await db
      .insert(users)
      .values([
        { id: ids.tenant, name: "Demo Tenant", email: "tenant@demo.com", role: "tenant", phone: "+49 151 00000001" },
        {
          id: ids.manager,
          name: "Demo Property Manager",
          email: "manager@demo.com",
          role: "property_manager",
          phone: "+49 151 00000002"
        },
        { id: ids.owner, name: "Demo Owner", email: "owner@demo.com", role: "owner", phone: "+49 151 00000003" }
      ])
      .onConflictDoNothing();

    await db
      .insert(properties)
      .values({
        id: ids.property,
        name: "Schillerstrasse 24",
        address: "Schillerstrasse 24, 80336 Munich"
      })
      .onConflictDoNothing();

    await db
      .insert(units)
      .values({
        id: ids.unit,
        propertyId: ids.property,
        label: "Apartment 3B",
        floor: "3",
        tenantUserId: ids.tenant,
        ownerUserId: ids.owner
      })
      .onConflictDoNothing();

    await db
      .insert(serviceProviders)
      .values([
        {
          id: ids.plumbing,
          name: "Muller Plumbing",
          trade: "plumbing",
          email: "plumbing@example.com",
          phone: "+49 89 1000001"
        },
        {
          id: ids.heating,
          name: "WarmTech Heating",
          trade: "heating",
          email: "heating@example.com",
          phone: "+49 89 1000002"
        },
        {
          id: ids.electricity,
          name: "Elektro Klein",
          trade: "electricity",
          email: "electricity@example.com",
          phone: "+49 89 1000003"
        }
      ])
      .onConflictDoNothing();

    await db
      .insert(tickets)
      .values([
        {
          id: ids.heatingTicket,
          title: "Heating does not work in the living room",
          description: "The living room heating has not worked since yesterday evening.",
          category: "heating",
          priority: "urgent",
          status: "submitted",
          propertyId: ids.property,
          unitId: ids.unit,
          roomOrLocation: "Living room",
          submittedByUserId: ids.tenant,
          assignedManagerUserId: ids.manager,
          contactDetails: "Tenant is reachable after 16:00.",
          accessDetails: "Ring Apartment 3B.",
          aiSummary: "Urgent heating outage in the living room.",
          aiConfidence: "0.910"
        },
        {
          id: ids.leakTicket,
          title: "Water dripping under kitchen sink",
          description: "Water is dripping under the kitchen sink and the cabinet floor is wet.",
          category: "water_damage",
          priority: "high",
          status: "waiting_for_owner_approval",
          propertyId: ids.property,
          unitId: ids.unit,
          roomOrLocation: "Kitchen",
          submittedByUserId: ids.tenant,
          assignedManagerUserId: ids.manager,
          assignedServiceProviderId: ids.plumbing,
          contactDetails: "Tenant can provide access tomorrow morning.",
          accessDetails: "Spare key is not available.",
          attachmentNote: "Demo photo placeholder: wet cabinet under sink.",
          approvalRequired: true,
          approvalStatus: "pending",
          estimatedCostCents: 45000,
          aiSummary: "High-priority leak under kitchen sink requires owner approval before repair.",
          aiConfidence: "0.870"
        },
        {
          id: ids.internetTicket,
          title: "TV signal unstable for several days",
          description: "The TV signal has been unstable and cuts out repeatedly.",
          category: "internet_tv",
          priority: "medium",
          status: "in_progress",
          propertyId: ids.property,
          unitId: ids.unit,
          roomOrLocation: "Living room",
          submittedByUserId: ids.tenant,
          assignedManagerUserId: ids.manager,
          contactDetails: "Tenant prefers email updates.",
          aiSummary: "Medium-priority TV signal issue in Apartment 3B.",
          aiConfidence: "0.780"
        }
      ])
      .onConflictDoNothing();

    await db
      .insert(ticketMessages)
      .values([
        {
          ticketId: ids.heatingTicket,
          authorUserId: ids.manager,
          message: "We received the heating issue and will review it today.",
          visibility: "tenant_visible"
        },
        {
          ticketId: ids.leakTicket,
          authorUserId: ids.manager,
          message: "Approval requested from the owner because a plumber visit may exceed the demo threshold.",
          visibility: "all"
        },
        {
          ticketId: ids.internetTicket,
          authorUserId: ids.manager,
          message: "Provider contact has been checked. Waiting for appointment confirmation.",
          visibility: "tenant_visible"
        }
      ])
      .onConflictDoNothing();

    await db
      .insert(approvals)
      .values({
        id: ids.approval,
        ticketId: ids.leakTicket,
        requestedByUserId: ids.manager,
        ownerUserId: ids.owner,
        status: "pending"
      })
      .onConflictDoNothing();

    console.log("Demo database seed completed.");
  } finally {
    await client.end();
  }
}

seed().catch((error) => {
  console.error("Demo database seed failed.");
  console.error(error);
  process.exit(1);
});

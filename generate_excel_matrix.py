import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def create_sbr_matrix_excel():
    wb = openpyxl.Workbook()
    
    # Define styles & colors
    navy_header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid") # Slate Navy 800
    section_header_fill = PatternFill(start_color="334155", end_color="334155", fill_type="solid") # Slate 700
    accent_blue_fill = PatternFill(start_color="2563EB", end_color="2563EB", fill_type="solid") # Blue 600
    
    # Status fills & fonts
    allowed_fill = PatternFill(start_color="DCFCE7", end_color="DCFCE7", fill_type="solid") # Light Green
    allowed_font = Font(name="Calibri", size=11, bold=True, color="166534")
    
    restricted_fill = PatternFill(start_color="FEE2E2", end_color="FEE2E2", fill_type="solid") # Light Red
    restricted_font = Font(name="Calibri", size=11, bold=True, color="991B1B")
    
    partial_fill = PatternFill(start_color="FEF3C7", end_color="FEF3C7", fill_type="solid") # Light Amber
    partial_font = Font(name="Calibri", size=11, bold=True, color="92400E")
    
    view_fill = PatternFill(start_color="E0E7FF", end_color="E0E7FF", fill_type="solid") # Light Indigo
    view_font = Font(name="Calibri", size=11, bold=True, color="3730A3")
    
    zebra_light = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
    white_fill = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")
    
    title_font = Font(name="Calibri", size=16, bold=True, color="FFFFFF")
    subtitle_font = Font(name="Calibri", size=11, italic=True, color="E2E8F0")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    regular_font = Font(name="Calibri", size=11, color="1E293B")
    bold_cell_font = Font(name="Calibri", size=11, bold=True, color="0F172A")
    
    thin_border_side = Side(border_style="thin", color="CBD5E1")
    thin_border = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=thin_border_side)
    
    align_center = Alignment(horizontal="center", vertical="center", wrap_text=True)
    align_left = Alignment(horizontal="left", vertical="center", wrap_text=True)
    align_top_left = Alignment(horizontal="left", vertical="top", wrap_text=True)

    # -------------------------------------------------------------
    # SHEET 1: RBAC & Feature Matrix
    # -------------------------------------------------------------
    ws1 = wb.active
    ws1.title = "Role & Feature Matrix"
    ws1.views.sheetView[0].showGridLines = True
    
    # Title Banner
    ws1.merge_cells("A1:G1")
    ws1["A1"] = "Sri Balaji Renewables (SBR) - Feature Matrix & Role-Based Access Control"
    ws1["A1"].font = title_font
    ws1["A1"].fill = navy_header_fill
    ws1["A1"].alignment = Alignment(horizontal="left", vertical="center", indent=1)
    ws1.row_dimensions[1].height = 40
    
    ws1.merge_cells("A2:G2")
    ws1["A2"] = "Role Comparison: Super Admin vs Store In-Charge (Operations & Store Leadership without Service System Disruption)"
    ws1["A2"].font = subtitle_font
    ws1["A2"].fill = navy_header_fill
    ws1["A2"].alignment = Alignment(horizontal="left", vertical="center", indent=1)
    ws1.row_dimensions[2].height = 25
    
    headers = [
        "Module / Domain",
        "Feature / Capability",
        "Available Options & Actions",
        "Store In-Charge Access",
        "Super Admin Access",
        "Operational Rationale & Safeguards",
        "Risk Level"
    ]
    
    ws1.append([]) # Row 3 blank
    ws1.row_dimensions[3].height = 10
    
    # Row 4: Column Headers
    ws1.append(headers)
    ws1.row_dimensions[4].height = 28
    for col_num in range(1, len(headers) + 1):
        cell = ws1.cell(row=4, column=col_num)
        cell.fill = accent_blue_fill
        cell.font = header_font
        cell.alignment = align_center
        cell.border = thin_border
        
    matrix_data = [
        # Module 1: Dispatch & Service Requests
        ("1. Dispatch & Service Tickets", "View & Filter Service Tickets", 
         "• View live ticket queue\n• Filter by status (Pending, Assigned, In-Progress, Completed, Cancelled)\n• Filter by date, priority, technician\n• Search customer name/phone", 
         "Full Access", "Full Access", "Enables smooth daily job dispatch and coordination with field agents.", "Low"),
        
        ("1. Dispatch & Service Tickets", "Assign / Re-Assign Technicians", 
         "• Assign open tickets to field technicians\n• Reassign tickets if technician is unavailable or overloaded\n• View real-time technician workload", 
         "Full Access", "Full Access", "Store In-charge manages technician availability and parts pairing.", "Low"),
        
        ("1. Dispatch & Service Tickets", "Create Service Ticket (Manual Entry)", 
         "• Create ticket for call-in / walk-in customer\n• Select service type (Solar, Softener, Scale Guard, Ro, Repair)\n• Set scheduled date & initial priority", 
         "Allowed", "Allowed", "Ensures walk-in store customers get immediate service dispatch.", "Low"),
         
        ("1. Dispatch & Service Tickets", "Update Service Status & Notes", 
         "• Mark status: In-Progress, On-Hold, Completed\n• Add internal dispatch & coordination notes", 
         "Allowed", "Allowed", "Required for daily status follow-up and field updates.", "Low"),
         
        ("1. Dispatch & Service Tickets", "Update Payment Collection Status", 
         "• Mark payment as Received (Cash/UPI/Bank)\n• Record transaction ID & notes", 
         "Allowed", "Allowed", "Enables job closure upon payment verification.", "Low"),
         
        ("1. Dispatch & Service Tickets", "Permanent Ticket Deletion", 
         "• Hard delete service tickets and history from database", 
         "Restricted (Admin Only)", "Full Access", "Prevents accidental or malicious audit trail deletion.", "Critical"),
         
        ("1. Dispatch & Service Tickets", "Live Agent & Ticket Map Tracking", 
         "• Interactive Leaflet Map tracking of active agents and service coordinates", 
         "Full Access", "Full Access", "Essential for locating agents and nearby emergency tickets.", "Low"),

        # Module 2: Inventory & Store Management
        ("2. Inventory & Van Stock", "Central Warehouse Stock Tracking", 
         "• Real-time stock counts across all categories (Solar, Softeners, Valves, Spares, Kits)\n• Low stock warning badges\n• Search by SKU & Barcode", 
         "Full Access", "Full Access", "Core responsibility: monitoring store health.", "Low"),
         
        ("2. Inventory & Van Stock", "Stock Inward / GRN Entry", 
         "• Inward receipt of new vendor supplies & factory shipments\n• Record PO number, invoice, batch number, received quantity", 
         "Full Control", "Full Control", "Store In-charge accepts and logs incoming materials.", "Medium"),
         
        ("2. Inventory & Van Stock", "Stock Outward to Van Kits (Transfer)", 
         "• Issue parts/products directly to Field Agent Van Kits\n• Specify agent, item SKU, and quantity\n• Auto-deduct from main store and credit agent van balance", 
         "Full Control", "Full Control", "Core responsibility: equipping field technicians daily.", "Medium"),
         
        ("2. Inventory & Van Stock", "Agent Indent Approval & Dispatch", 
         "• Review parts replenishment indents requested by agents\n• Approve & Dispatch (Deducts central inventory, updates van)\n• Reject Indent with reason/notes", 
         "Full Authority", "Full Authority", "Store In-charge validates necessity before releasing parts.", "Medium"),
         
        ("2. Inventory & Van Stock", "Agent Van Stock Live Audit", 
         "• View live inventory balances inside each agent's van\n• Reconcile items consumed in jobs against stock transferred", 
         "Full Access", "Full Access", "Maintains real-time field inventory accountability.", "Low"),
         
        ("2. Inventory & Van Stock", "Damaged / Scrap / Return Logging", 
         "• Log defective parts returned from field or customer sites\n• Categorize as Under Warranty, Defective, Scrap", 
         "Allowed (Flag for Admin)", "Full Control", "Store In-charge logs physical receipt; Admin approves write-off value.", "Medium"),
         
        ("2. Inventory & Van Stock", "Low-Stock Reorder Threshold Setup", 
         "• Define minimum threshold quantities per product SKU for automated reorder warnings", 
         "Allowed", "Allowed", "Proactive inventory management.", "Low"),

        # Module 3: Cash Reconciliation & Handovers
        ("3. Cash & Financial Reconciliation", "Review Agent Cash Handovers", 
         "• View pending cash submissions from field agents with job breakdown, customer details, and collected cash amounts", 
         "Full Access", "Full Access", "Primary physical point of contact for field cash collection.", "Low"),
         
        ("3. Cash & Financial Reconciliation", "Acknowledge Cash & Note Discrepancy", 
         "• Verify physical currency received against agent claim\n• Enter exact received amount\n• Flag discrepancies with store notes & timestamp\n• Instant ledger update", 
         "Full Authority", "Full Authority", "Eliminates cash leakage with dual-party reconciliation.", "High"),
         
        ("3. Cash & Financial Reconciliation", "Cash Audit Ledger & Export", 
         "• Complete chronological log of verified handovers\n• Filter by date, month, agent, status\n• Export reports to Excel/CSV", 
         "View & Export", "View & Export", "Daily settlement and handover to management.", "Low"),
         
        ("3. Cash & Financial Reconciliation", "Bank Deposit Logging", 
         "• Record handover of daily physical cash into bank account\n• Enter deposit slip number & bank transaction reference", 
         "Record & Submit", "Full Approval", "Provides clear audit trail from Agent -> Store In-charge -> Bank.", "Medium"),
         
        ("3. Cash & Financial Reconciliation", "Financial Record Alteration / Waiver", 
         "• Modify past verified cash ledger entries or waive agent cash dues", 
         "Restricted (Admin Only)", "Full Access", "Protects financial integrity and prevents tampering.", "Critical"),

        # Module 4: Field Technicians
        ("4. Technician Management", "Technician Directory & Live Status", 
         "• View roster of technicians, contact details, ratings, completed jobs, online/offline status", 
         "Full Access", "Full Access", "Daily operational coordination.", "Low"),
         
        ("4. Technician Management", "Onboard New Technician", 
         "• Create agent profile (Name, Phone, Email, Temporary Password, Specialization, Location)", 
         "Allowed (Configurable)", "Full Control", "Allows Store In-charge to quickly onboard local field technicians.", "Medium"),
         
        ("4. Technician Management", "Account Deactivation & Password Reset", 
         "• Suspend/terminate technician accounts, reset passwords, change access credentials", 
         "Restricted (Admin Only)", "Full Control", "Security control strictly governed by Super Admin.", "High"),

        # Module 5: Customer Database
        ("5. Customer Database", "View Customers & Service History", 
         "• Search and inspect customer details, addresses, equipment installed, service history", 
         "Full Access", "Full Access", "Required to verify past installations and customer requests.", "Low"),
         
        ("5. Customer Database", "Manual Customer Entry", 
         "• Add customer record (Name, Phone, Address, Product, Model, Purchase Date)", 
         "Allowed", "Allowed", "Enables registering direct retail or walk-in buyers.", "Low"),
         
        ("5. Customer Database", "Bulk Customer Upload (Excel/CSV)", 
         "• Upload master customer lists via spreadsheet", 
         "Append Only", "Replace & Overwrite", "Store in-charge can add new batches; cannot wipe existing master.", "High"),
         
        ("5. Customer Database", "Delete Customer Records", 
         "• Remove customer profiles or delete historical records", 
         "Restricted (Admin Only)", "Full Control", "Prevents accidental loss of warranty and service records.", "Critical"),

        # Module 6: Products & Catalog
        ("6. Product & Spare Parts Catalog", "Browse Products, Manuals & Specs", 
         "• View product specs, models, warranty cards, installation brochures", 
         "Full Access", "Full Access", "Essential for customer queries and technician guidance.", "Low"),
         
        ("6. Product & Spare Parts Catalog", "Edit Stock Levels & Warehouse Bins", 
         "• Update available quantity, rack/bin location in store", 
         "Allowed", "Allowed", "Ensures warehouse location accuracy.", "Low"),
         
        ("6. Product & Spare Parts Catalog", "Modify Base Prices & Taxes", 
         "• Edit master selling price (MRP), GST rates, customer discounts", 
         "View Only", "Full Control", "Pricing policy is reserved for Super Admin.", "High"),
         
        ("6. Product & Spare Parts Catalog", "Add / Delete Products from Catalog", 
         "• Create new official product offerings or delete catalog listings", 
         "Restricted (Admin Only)", "Full Control", "Preserves catalog integrity across apps and web store.", "High"),

        # Module 7: Referral & Marketing
        ("7. Referral & Loyalty Program", "View Referral Network & Stats", 
         "• View customer referral tree and accumulated points", 
         "View Only", "Full Control", "Informational access for store inquiries.", "Low"),
         
        ("7. Referral & Loyalty Program", "Approve & Payout Referral Rewards", 
         "• Approve cash/credit payouts for referral earnings", 
         "Restricted (Admin Only)", "Full Control", "Financial disbursement controlled by Super Admin.", "High"),

        # Module 8: System Configuration & Blogs
        ("8. System & Governance", "Blog & Marketing Content", 
         "• Create, edit, and publish blogs on website", 
         "Hidden / View Only", "Full Control", "Marketing and branding responsibility.", "Low"),
         
        ("8. System & Governance", "System Settings & API Keys", 
         "• Manage SMS Gateway keys, FCM push tokens, payment gateways", 
         "Restricted (Hidden)", "Full Control", "Guards infrastructure security.", "Critical"),
         
        ("8. System & Governance", "User Role & Permission Elevation", 
         "• Change user roles (e.g. promoting Agent to Admin/In-charge)", 
         "Restricted (Admin Only)", "Full Control", "Prevents unauthorized privilege escalation.", "Critical")
    ]
    
    current_row = 5
    for item in matrix_data:
        module, feature, options, incharge_perm, admin_perm, rationale, risk = item
        ws1.append([module, feature, options, incharge_perm, admin_perm, rationale, risk])
        
        row_cells = [ws1.cell(row=current_row, column=c) for c in range(1, 8)]
        
        # Row zebra fill
        fill_to_use = zebra_light if current_row % 2 == 0 else white_fill
        for c_idx, cell in enumerate(row_cells):
            cell.fill = fill_to_use
            cell.border = thin_border
            cell.font = regular_font
            cell.alignment = align_top_left
            
        row_cells[0].font = bold_cell_font
        row_cells[1].font = bold_cell_font
        
        # Incharge permission badge formatting
        incharge_cell = row_cells[3]
        incharge_cell.alignment = align_center
        val = str(incharge_cell.value)
        if "Full" in val or val == "Allowed":
            incharge_cell.fill = allowed_fill
            incharge_cell.font = allowed_font
        elif "Restricted" in val or "Hidden" in val:
            incharge_cell.fill = restricted_fill
            incharge_cell.font = restricted_font
        elif "View Only" in val:
            incharge_cell.fill = view_fill
            incharge_cell.font = view_font
        else:
            incharge_cell.fill = partial_fill
            incharge_cell.font = partial_font
            
        # Admin permission badge formatting
        admin_cell = row_cells[4]
        admin_cell.alignment = align_center
        admin_cell.fill = allowed_fill
        admin_cell.font = allowed_font
        
        # Risk column formatting
        risk_cell = row_cells[6]
        risk_cell.alignment = align_center
        r_val = str(risk_cell.value)
        if r_val == "Critical":
            risk_cell.fill = restricted_fill
            risk_cell.font = restricted_font
        elif r_val == "High":
            risk_cell.fill = partial_fill
            risk_cell.font = partial_font
        elif r_val == "Medium":
            risk_cell.fill = zebra_light
            risk_cell.font = Font(name="Calibri", size=11, bold=True, color="475569")
        else:
            risk_cell.fill = allowed_fill
            risk_cell.font = Font(name="Calibri", size=11, color="166534")

        ws1.row_dimensions[current_row].height = 55
        current_row += 1

    # Auto adjust column widths
    col_widths = {
        "A": 26, # Module
        "B": 28, # Feature
        "C": 48, # Options
        "D": 22, # Store In-Charge
        "E": 18, # Super Admin
        "F": 42, # Rationale
        "G": 14  # Risk
    }
    for col_letter, width in col_widths.items():
        ws1.column_dimensions[col_letter].width = width

    # -------------------------------------------------------------
    # SHEET 2: Store In-Charge Daily Workflows
    # -------------------------------------------------------------
    ws2 = wb.create_sheet(title="Store Incharge Workflows")
    ws2.views.sheetView[0].showGridLines = True
    
    ws2.merge_cells("A1:E1")
    ws2["A1"] = "Store In-Charge - Daily Operational Workflows & Action Checklist"
    ws2["A1"].font = title_font
    ws2["A1"].fill = navy_header_fill
    ws2["A1"].alignment = Alignment(horizontal="left", vertical="center", indent=1)
    ws2.row_dimensions[1].height = 40
    
    workflow_headers = ["Workflow Phase", "Action Item", "System Feature / Tab", "Step-by-Step Procedure", "Key Safeguard"]
    ws2.append([])
    ws2.append(workflow_headers)
    ws2.row_dimensions[3].height = 28
    
    for col_num in range(1, len(workflow_headers) + 1):
        cell = ws2.cell(row=3, column=col_num)
        cell.fill = accent_blue_fill
        cell.font = header_font
        cell.alignment = align_center
        cell.border = thin_border
        
    workflows = [
        ("Morning Dispatch", "Review Open Tickets", "Dispatch Management", "1. Filter tickets by 'Pending'\n2. Inspect customer service urgency and location\n3. Match ticket with technician skill set", "Ensures high priority tickets are handled first"),
        ("Morning Dispatch", "Technician Assignment", "Dispatch Management", "1. Click 'Assign' on ticket\n2. Select active Field Agent\n3. Status changes to 'Assigned' and push notification sent to agent", "Checks agent current active load before assignment"),
        ("Morning Dispatch", "Van Kit Top-up / Dispatch", "Van Stock & Indents", "1. Review agent pending indents\n2. Verify available store stock\n3. Click 'Dispatch' to debit store & credit technician van kit", "Prevents releasing unrecorded stock"),
        ("Throughout the Day", "Live Tracking & Coordination", "Dispatch Management", "1. Monitor Leaflet Live Map for agent locations\n2. Handle customer inquiry calls\n3. Re-route nearby technicians for urgent calls", "Improves customer turnaround time"),
        ("Throughout the Day", "Material Inward (GRN)", "Store Inventory", "1. Verify supplier delivery challan\n2. Enter received quantities & serial numbers\n3. Instant catalog stock increment", "Maintains real-time physical store balance"),
        ("Evening Settlement", "Agent Cash Collection", "Cash Handovers", "1. Field agent submits daily cash summary\n2. Store In-charge counts physical notes\n3. Verify against system expected total", "Requires dual confirmation"),
        ("Evening Settlement", "Acknowledge & Record Discrepancy", "Cash Handovers", "1. Click 'Acknowledge' in dashboard\n2. Enter actual received cash\n3. If difference exists, enter mandatory discrepancy notes\n4. Submit to update ledger", "Automated discrepancy flag sent to Super Admin"),
        ("Evening Settlement", "Generate Daily Settlement Sheet", "Audit Ledger", "1. Export day's cash collection ledger\n2. Reconcile with bank cash deposit receipt\n3. Archive daily closing report", "Full transparency between Store & Accounts")
    ]
    
    w_row = 4
    for item in workflows:
        ws2.append(list(item))
        for col_idx in range(1, 6):
            c = ws2.cell(row=w_row, column=col_idx)
            c.fill = zebra_light if w_row % 2 == 0 else white_fill
            c.border = thin_border
            c.font = regular_font
            c.alignment = align_top_left
            if col_idx in [1, 2]:
                c.font = bold_cell_font
        ws2.row_dimensions[w_row].height = 45
        w_row += 1
        
    w_widths = {"A": 22, "B": 26, "C": 24, "D": 45, "E": 35}
    for col_letter, width in w_widths.items():
        ws2.column_dimensions[col_letter].width = width

    # -------------------------------------------------------------
    # SHEET 3: Safeguards & Restrictions (Boundary Rules)
    # -------------------------------------------------------------
    ws3 = wb.create_sheet(title="Security & Boundaries")
    ws3.views.sheetView[0].showGridLines = True
    
    ws3.merge_cells("A1:D1")
    ws3["A1"] = "Security Boundaries - Safeguarding Service Management & Core Infrastructure"
    ws3["A1"].font = title_font
    ws3["A1"].fill = navy_header_fill
    ws3["A1"].alignment = Alignment(horizontal="left", vertical="center", indent=1)
    ws3.row_dimensions[1].height = 40
    
    sec_headers = ["Boundary Category", "Restricted Action (Store In-Charge)", "Why Restricted (Risk Factor)", "Super Admin Escalation Workflow"]
    ws3.append([])
    ws3.append(sec_headers)
    ws3.row_dimensions[3].height = 28
    
    for col_num in range(1, len(sec_headers) + 1):
        cell = ws3.cell(row=3, column=col_num)
        cell.fill = accent_blue_fill
        cell.font = header_font
        cell.alignment = align_center
        cell.border = thin_border
        
    sec_rules = [
        ("Data Protection", "Permanent Deletion of Service Requests", "Risk of hiding incomplete, disputed, or fraudulent service jobs.", "Store In-charge flags ticket as 'Disputed / Needs Review'. Only Super Admin can hard delete."),
        ("Financial Integrity", "Waiving Cash Dues or Editing Past Ledgers", "Risk of cash embezzlement or untracked financial adjustments.", "Store In-charge notes discrepancy during handover. Super Admin reviews and issues credit adjustments."),
        ("Catalog & Pricing", "Altering Base Selling Prices or Tax Rates", "Unauthorized discounts or margin loss across web and mobile sales.", "Price updates require Admin login. Store In-charge can only update physical bin locations & inventory count."),
        ("Access Control", "Modifying User Roles / Escalating Privileges", "Risk of rogue account creation or privilege escalation.", "Store In-charge can onboard new Field Agents; cannot modify existing Admin or In-Charge profiles."),
        ("System Infrastructure", "Access to SMS, Push Notification & Payment Keys", "Security breach or API credentials exposure.", "Completely hidden from Store In-Charge dashboard. Configured solely by Super Admin.")
    ]
    
    s_row = 4
    for rule in sec_rules:
        ws3.append(list(rule))
        for col_idx in range(1, 5):
            c = ws3.cell(row=s_row, column=col_idx)
            c.fill = zebra_light if s_row % 2 == 0 else white_fill
            c.border = thin_border
            c.font = regular_font
            c.alignment = align_top_left
            if col_idx == 1:
                c.font = bold_cell_font
            if col_idx == 2:
                c.font = Font(name="Calibri", size=11, bold=True, color="991B1B")
        ws3.row_dimensions[s_row].height = 45
        s_row += 1
        
    s_widths = {"A": 24, "B": 35, "C": 42, "D": 45}
    for col_letter, width in s_widths.items():
        ws3.column_dimensions[col_letter].width = width

    # Save to file
    output_filename = "/Users/doraswamyrajumeesala/Documents/SBR Final/SBR_Store_Incharge_Role_Features_Matrix.xlsx"
    wb.save(output_filename)
    print(f"Excel matrix saved successfully at: {output_filename}")

if __name__ == "__main__":
    create_sbr_matrix_excel()

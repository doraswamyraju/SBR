package com.sbr.sms.utils

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import android.widget.Toast
import androidx.core.content.FileProvider
import com.sbr.sms.data.models.ServiceRequest
import java.io.File
import java.io.FileOutputStream
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Locale

object InvoicePdfGenerator {

    fun generateAndOpenInvoice(context: Context, request: ServiceRequest) {
        try {
            val file = generateInvoicePdf(context, request)
            val uri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.provider",
                file
            )

            val viewIntent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, "application/pdf")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }

            val chooser = Intent.createChooser(viewIntent, "Open Tax Invoice PDF").apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(chooser)
        } catch (e: Exception) {
            Toast.makeText(context, "Error opening PDF invoice: ${e.localizedMessage}", Toast.LENGTH_LONG).show()
        }
    }

    private fun generateInvoicePdf(context: Context, request: ServiceRequest): File {
        val document = PdfDocument()
        val pageInfo = PdfDocument.PageInfo.Builder(595, 842, 1).create() // A4 (595 x 842 pt)
        val page = document.startPage(pageInfo)
        val canvas = page.canvas

        val primaryPaint = Paint().apply {
            color = Color.rgb(21, 128, 61) // Emerald green
            textSize = 20f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            isAntiAlias = true
        }

        val subPaint = Paint().apply {
            color = Color.rgb(100, 116, 139)
            textSize = 10f
            typeface = Typeface.DEFAULT
            isAntiAlias = true
        }

        val textPaint = Paint().apply {
            color = Color.rgb(15, 23, 42)
            textSize = 11f
            typeface = Typeface.DEFAULT
            isAntiAlias = true
        }

        val boldPaint = Paint().apply {
            color = Color.rgb(15, 23, 42)
            textSize = 12f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            isAntiAlias = true
        }

        val linePaint = Paint().apply {
            color = Color.rgb(226, 232, 240)
            strokeWidth = 1f
        }

        val currencyFormat = NumberFormat.getCurrencyInstance(Locale("en", "IN"))
        val dateFormat = SimpleDateFormat("dd MMMM yyyy, hh:mm a", Locale.getDefault())

        var y = 50f

        // Brand Header
        canvas.drawText("SRI BALAJI RENEWABLES", 40f, y, primaryPaint)
        y += 16f
        canvas.drawText("Solar & Sustainable Energy Systems • Tirupati, Andhra Pradesh", 40f, y, subPaint)
        y += 14f
        canvas.drawText("Support: +91 99000 00000 | Email: care@sribalajirenewables.com", 40f, y, subPaint)
        y += 15f

        canvas.drawLine(40f, y, 555f, y, linePaint)
        y += 25f

        // Invoice Title Badge
        val titlePaint = Paint().apply {
            color = Color.rgb(15, 23, 42)
            textSize = 15f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            isAntiAlias = true
        }
        canvas.drawText("TAX INVOICE / PAYMENT RECEIPT", 40f, y, titlePaint)

        val statusPaint = Paint().apply {
            color = Color.rgb(22, 101, 52)
            textSize = 13f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            isAntiAlias = true
        }
        canvas.drawText("[ PAID - ACKNOWLEDGED ]", 380f, y, statusPaint)
        y += 25f

        // Invoice Meta Info
        val invoiceNo = "INV-${request.id.takeLast(8).uppercase()}"
        canvas.drawText("Invoice Number: $invoiceNo", 40f, y, boldPaint)
        canvas.drawText("Receipt Date: ${request.paymentTimestamp?.let { dateFormat.format(it) } ?: "N/A"}", 320f, y, textPaint)
        y += 18f

        canvas.drawText("Service Ticket: #${request.id.takeLast(8).uppercase()}", 40f, y, textPaint)
        canvas.drawText("Payment Method: ${request.paymentMethod ?: "Online"}", 320f, y, textPaint)
        y += 24f

        // Customer Info Card Box
        val boxPaint = Paint().apply {
            color = Color.rgb(248, 250, 252)
            style = Paint.Style.FILL
        }
        canvas.drawRect(40f, y, 555f, y + 60f, boxPaint)
        canvas.drawRect(40f, y, 555f, y + 60f, Paint().apply { color = Color.rgb(226, 232, 240); style = Paint.Style.STROKE; strokeWidth = 1f })

        canvas.drawText("BILLED TO:", 50f, y + 16f, boldPaint)
        canvas.drawText("Customer: ${request.customerName ?: request.customerId}", 50f, y + 32f, textPaint)
        canvas.drawText("Phone: ${request.customerPhone ?: "N/A"}", 50f, y + 48f, textPaint)
        canvas.drawText("Service Site: ${request.customerAddress.take(45)}", 300f, y + 32f, textPaint)
        y += 80f

        // Table Header
        val headerBoxPaint = Paint().apply {
            color = Color.rgb(241, 245, 249)
            style = Paint.Style.FILL
        }
        canvas.drawRect(40f, y, 555f, y + 25f, headerBoxPaint)
        canvas.drawText("Item / Description", 50f, y + 17f, boldPaint)
        canvas.drawText("Amount", 480f, y + 17f, boldPaint)
        y += 35f

        // Line Items
        canvas.drawText("1. Service & Labor Charges (${request.serviceType})", 50f, y, textPaint)
        canvas.drawText(currencyFormat.format(request.serviceCharge ?: 0.0), 480f, y, textPaint)
        y += 20f

        canvas.drawText("2. Spare Parts & Consumables Installed", 50f, y, textPaint)
        canvas.drawText(currencyFormat.format(request.inventoryTotal ?: 0.0), 480f, y, textPaint)
        y += 20f

        if (request.discount != null && request.discount > 0) {
            val discountPaint = Paint().apply {
                color = Color.rgb(22, 101, 52)
                textSize = 11f
                typeface = Typeface.DEFAULT
                isAntiAlias = true
            }
            canvas.drawText("3. Promotional Discount Applied", 50f, y, discountPaint)
            canvas.drawText("-${currencyFormat.format(request.discount)}", 480f, y, discountPaint)
            y += 20f
        }

        y += 10f
        canvas.drawLine(40f, y, 555f, y, linePaint)
        y += 22f

        // Total
        val totalAmount = request.paymentAmount ?: request.finalAmount ?: 0.0
        val totalPaint = Paint().apply {
            color = Color.rgb(15, 23, 42)
            textSize = 15f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            isAntiAlias = true
        }
        canvas.drawText("Total Paid Amount:", 320f, y, totalPaint)
        canvas.drawText(currencyFormat.format(totalAmount), 460f, y, totalPaint)
        y += 40f

        // Terms & Footer
        canvas.drawLine(40f, y, 555f, y, linePaint)
        y += 20f
        canvas.drawText("Terms & Warranty Conditions:", 40f, y, boldPaint)
        y += 14f
        canvas.drawText("• Standard 90-day warranty applies to installed genuine parts and repair labor.", 40f, y, subPaint)
        y += 12f
        canvas.drawText("• For post-service technical support, open a ticket via SBR mobile application.", 40f, y, subPaint)
        y += 30f

        val centerFooterPaint = Paint().apply {
            color = Color.rgb(148, 163, 184)
            textSize = 9f
            textAlign = Paint.Align.CENTER
            isAntiAlias = true
        }
        canvas.drawText("This is an electronically generated tax invoice. No signature is required.", 297f, y, centerFooterPaint)
        y += 12f
        canvas.drawText("Thank you for powering the future with Sri Balaji Renewables!", 297f, y, centerFooterPaint)

        document.finishPage(page)

        // Save PDF file
        val invoicesDir = File(context.cacheDir, "invoices").apply { mkdirs() }
        val outputFile = File(invoicesDir, "SBR_Invoice_${request.id.takeLast(8)}.pdf")
        FileOutputStream(outputFile).use { out ->
            document.writeTo(out)
        }
        document.close()

        return outputFile
    }
}

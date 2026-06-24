package com.sbr.sms.ui.common.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaymentDetailsDialog(
    requestAmount: Double,
    onDismiss: () -> Unit,
    onSubmit: (amount: Double, method: String, isFree: Boolean) -> Unit
) {
    var amount by remember { mutableStateOf(requestAmount.toString()) }
    var selectedMethod by remember { mutableStateOf("Cash") }
    var isFreeService by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Update Payment Details") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = amount,
                    onValueChange = { amount = it },
                    label = { Text("Amount Received") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    enabled = !isFreeService // Disable if marked as free
                )

                Text("Payment Method", style = MaterialTheme.typography.labelLarge)
                Row {
                    RadioButton(
                        selected = selectedMethod == "Cash",
                        onClick = { selectedMethod = "Cash" },
                        enabled = !isFreeService
                    )
                    Text("Cash", Modifier.align(Alignment.CenterVertically))
                    Spacer(Modifier.width(16.dp))
                    RadioButton(
                        selected = selectedMethod == "Online",
                        onClick = { selectedMethod = "Online" },
                        enabled = !isFreeService
                    )
                    Text("Online", Modifier.align(Alignment.CenterVertically))
                }

                Row(
                    modifier = Modifier.selectable(
                        selected = isFreeService,
                        onClick = { isFreeService = !isFreeService }
                    ).padding(vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Checkbox(
                        checked = isFreeService,
                        onCheckedChange = { isFreeService = it }
                    )
                    Text("Mark as Free Service")
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val finalAmount = if (isFreeService) 0.0 else amount.toDoubleOrNull() ?: 0.0
                    val finalMethod = if (isFreeService) "Free" else selectedMethod
                    onSubmit(finalAmount, finalMethod, isFreeService)
                }
            ) {
                Text("Submit")
            }
        },
        dismissButton = {
            Button(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
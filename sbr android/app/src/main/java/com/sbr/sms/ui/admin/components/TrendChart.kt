package com.sbr.sms.ui.admin.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.background



@Composable
fun TrendChart(trends: Map<String, Int>) {
    val maxValue = trends.values.maxOrNull() ?: 1
    Row(
        modifier = Modifier.fillMaxWidth().height(100.dp),
        verticalAlignment = Alignment.Bottom
    ) {
        trends.entries.forEach { (label, value) ->
            ChartBar(
                label = label,
                value = value,
                maxValue = maxValue,
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
fun ChartBar(label: String, value: Int, maxValue: Int, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier.padding(horizontal = 4.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Bottom
    ) {
        Box(
            modifier = Modifier
                .height((value.toFloat() / maxValue * 80).dp)
                .fillMaxWidth()
                .background(MaterialTheme.colorScheme.primary)
        )
        Text(label, style = MaterialTheme.typography.labelSmall)
    }
}

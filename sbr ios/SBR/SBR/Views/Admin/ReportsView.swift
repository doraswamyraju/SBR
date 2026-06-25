import SwiftUI

struct ReportsView: View {
    var body: some View {
        VStack {
            Spacer()
            Image(systemName: "chart.bar.doc.horizontal.fill")
                .font(.system(size: 60))
                .foregroundColor(.gray)
                .padding(.bottom, 12)
            
            Text("Reports Screen (Placeholder)")
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(.gray)
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(SBRColors.background.ignoresSafeArea())
    }
}

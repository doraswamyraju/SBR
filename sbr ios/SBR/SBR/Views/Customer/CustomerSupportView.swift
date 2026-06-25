import SwiftUI

struct CustomerSupportView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header
                VStack(spacing: 8) {
                    Image(systemName: "questionmark.bubble.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.indigo)
                    
                    Text("How can we help?")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    
                    Text("Sri Balaji Renewables Support Desk")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                }
                .padding(.top)
                
                // Helplines
                VStack(alignment: .leading, spacing: 14) {
                    Text("DIRECT CONTACT HELPLINE")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.indigo)
                    
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Customer Support")
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                            Text("+91 98765 43210")
                                .font(.footnote)
                                .foregroundColor(.gray)
                        }
                        Spacer()
                        Button(action: {
                            if let url = URL(string: "tel:+919876543210") {
                                UIApplication.shared.open(url)
                            }
                        }) {
                            Image(systemName: "phone.circle.fill")
                                .font(.title)
                                .foregroundColor(.green)
                        }
                    }
                    
                    Divider().background(Color.white.opacity(0.1))
                    
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Email Support")
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                            Text("support@sribalajirenewables.com")
                                .font(.footnote)
                                .foregroundColor(.gray)
                        }
                        Spacer()
                        Button(action: {
                            if let url = URL(string: "mailto:support@sribalajirenewables.com") {
                                UIApplication.shared.open(url)
                            }
                        }) {
                            Image(systemName: "envelope.circle.fill")
                                .font(.title)
                                .foregroundColor(.indigo)
                        }
                    }
                }
                .padding()
                .background(Color.white.opacity(0.02))
                .cornerRadius(12)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.white.opacity(0.05), lineWidth: 1)
                )
                .padding(.horizontal)
                
                // FAQ Section
                VStack(alignment: .leading, spacing: 14) {
                    Text("FREQUENTLY ASKED QUESTIONS")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.indigo)
                    
                    FAQRow(question: "How do I request a solar water heater service?", answer: "Go to the 'Book Service' tab in your app, select Solar Water Heaters, specify symptoms or requirements, add your address, and click Book Appointment.")
                    
                    Divider().background(Color.white.opacity(0.1))
                    
                    FAQRow(question: "How do I track my active maintenance service request?", answer: "Once our administrator assigns a field technician to your service, you will see a 'Track Live' button on the Overview tab request card to trace their active GPS position.")
                    
                    Divider().background(Color.white.opacity(0.1))
                    
                    FAQRow(question: "What is a contract maintenance plan?", answer: "Clients on our Recurring Contract maintenance plan receive regular scheduled maintenance check-ups for softeners, softeners regeneration, and RO purifier service automatically.")
                }
                .padding()
                .background(Color.white.opacity(0.02))
                .cornerRadius(12)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.white.opacity(0.05), lineWidth: 1)
                )
                .padding(.horizontal)
                
                Spacer()
            }
        }
        .background(Color(red: 0.05, green: 0.05, blue: 0.08).ignoresSafeArea())
        .navigationTitle("Help & Support")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct FAQRow: View {
    let question: String
    let answer: String
    @State private var isExpanded = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Button(action: { isExpanded.toggle() }) {
                HStack {
                    Text(question)
                        .font(.footnote)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .multilineTextAlignment(.leading)
                    Spacer()
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }
            
            if isExpanded {
                Text(answer)
                    .font(.caption2)
                    .foregroundColor(.gray)
                    .transition(.opacity)
            }
        }
    }
}

import SwiftUI

private struct FAQItem {
    let question: String
    let answer: String
}

struct CustomerSupportView: View {
    @State private var showingChatAlert = false
    
    private let faqList = [
        FAQItem(
            question: "How do I track my service agent?",
            answer: "You can track your agent in real-time using the 'Track Agent' button on the service detail page once your service request is in progress."
        ),
        FAQItem(
            question: "How do I make payments?",
            answer: "Payments can be made through UPI, credit/debit cards, or other available methods once a service is marked as complete by the agent."
        ),
        FAQItem(
            question: "Can I reschedule my service?",
            answer: "Yes, you can reschedule services up to 2 hours before the scheduled time by contacting our support team."
        )
    ]
    
    var body: some View {
        ScrollView {
            VStack(alignment: .center, spacing: 24) {
                // Header (Android aligned)
                VStack(spacing: 8) {
                    Text("Help & Support")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(SBRColors.textPrimary)
                    
                    Text("We're here to help you with any questions or issues.")
                        .font(.subheadline)
                        .foregroundColor(SBRColors.textSecondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                }
                .padding(.top, 16)
                
                // Contact Options Row (Android aligned)
                HStack(alignment: .top, spacing: 12) {
                    ContactOptionCard(
                        icon: "phone.fill",
                        iconColor: .green,
                        title: "Call Support",
                        subtitle: "Speak directly with our team",
                        buttonText: "Call Now",
                        action: {
                            if let url = URL(string: "tel:18001234567") {
                                UIApplication.shared.open(url)
                            }
                        }
                    )
                    
                    ContactOptionCard(
                        icon: "bubble.left.and.bubble.right.fill",
                        iconColor: .blue,
                        title: "Live Chat",
                        subtitle: "Chat with support agents",
                        buttonText: "Start Chat",
                        action: {
                            showingChatAlert = true
                        }
                    )
                    
                    ContactOptionCard(
                        icon: "envelope.fill",
                        iconColor: SBRColors.primaryBlue,
                        title: "Email Support",
                        subtitle: "Send us your questions via email",
                        buttonText: "Send Email",
                        action: {
                            if let url = URL(string: "mailto:support@SBR.com?subject=Support%20Request%20-%20SBR%20App") {
                                UIApplication.shared.open(url)
                            }
                        }
                    )
                }
                .padding(.horizontal)
                
                // FAQs Section
                VStack(alignment: .leading, spacing: 16) {
                    Text("Frequently Asked Questions")
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(SBRColors.textPrimary)
                        .padding(.horizontal)
                    
                    VStack(spacing: 12) {
                        ForEach(faqList, id: \.question) { faq in
                            FaqCardView(question: faq.question, answer: faq.answer)
                        }
                    }
                    .padding(.horizontal)
                }
                
                Spacer()
            }
            .padding(.bottom, 24)
        }
        .background(SBRColors.background.ignoresSafeArea())
        .navigationTitle("Contact Support")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Live Chat", isPresented: $showingChatAlert) {
            Button("OK", role: .cancel) {}
        } message: {
            Text("Live Chat feature coming soon!")
        }
    }
}

// Side-by-side contact cards matching Android's ContactOptionCard
struct ContactOptionCard: View {
    let icon: String
    let iconColor: Color
    let title: String
    let subtitle: String
    let buttonText: String
    let action: () -> Void
    
    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(iconColor)
                .frame(width: 48, height: 48)
                .background(iconColor.opacity(0.1))
                .clipShape(Circle())
            
            Text(title)
                .font(.footnote)
                .fontWeight(.bold)
                .foregroundColor(SBRColors.textPrimary)
                .multilineTextAlignment(.center)
            
            Text(subtitle)
                .font(.system(size: 10))
                .foregroundColor(SBRColors.textSecondary)
                .multilineTextAlignment(.center)
                .lineLimit(3)
                .frame(height: 36)
            
            Spacer(minLength: 4)
            
            Button(action: action) {
                Text(buttonText)
                    .font(.caption2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .padding(.vertical, 6)
                    .padding(.horizontal, 10)
                    .background(SBRColors.primaryBlue)
                    .cornerRadius(8)
            }
            .buttonStyle(PlainButtonStyle())
        }
        .padding(12)
        .frame(maxWidth: .infinity)
        .frame(height: 190)
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.03), radius: 3, x: 0, y: 1)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.gray.opacity(0.12), lineWidth: 1)
        )
    }
}

// Expandable FAQs matching Android's FaqCard
struct FaqCardView: View {
    let question: String
    let answer: String
    @State private var isExpanded = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button(action: {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                    isExpanded.toggle()
                }
            }) {
                HStack {
                    Text(question)
                        .font(.body)
                        .fontWeight(.semibold)
                        .foregroundColor(SBRColors.textPrimary)
                        .multilineTextAlignment(.leading)
                    Spacer()
                    Image(systemName: isExpanded ? "minus" : "plus")
                        .font(.footnote)
                        .foregroundColor(SBRColors.textPrimary)
                }
                .padding(16)
                .background(Color.white)
            }
            .buttonStyle(PlainButtonStyle())
            
            if isExpanded {
                Divider().padding(.horizontal, 16)
                Text(answer)
                    .font(.subheadline)
                    .foregroundColor(SBRColors.textSecondary)
                    .padding(16)
                    .background(Color(red: 0.98, green: 0.98, blue: 0.99))
            }
        }
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.02), radius: 3, x: 0, y: 1)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.gray.opacity(0.12), lineWidth: 1)
        )
    }
}

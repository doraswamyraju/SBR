import SwiftUI

struct AuthView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @State private var isLogin = true
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var phone = ""
    @State private var selectedRole: UserRole = .customer
    @State private var showingForgotAlert = false
    
    private let primaryBlue = SBRColors.primaryBlue
    
    var body: some View {
        ZStack {
            // Light background matching Android default theme
            Color(red: 0.97, green: 0.98, blue: 1.0)
                .ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: 24) {
                    Spacer().frame(height: 50)
                    
                    // Brand Identity (SB Logo + welcome)
                    VStack(spacing: 12) {
                        Image("Logo")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 90, height: 90)
                            .cornerRadius(16)
                            .shadow(color: Color.black.opacity(0.08), radius: 6, x: 0, y: 3)
                        
                        Text("Welcome to SBR")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(Color(red: 0.1, green: 0.1, blue: 0.2))
                        
                        Text("Sign in to continue")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                    }
                    
                    // Auth Segment Control Tab (Login / Sign Up)
                    HStack {
                        Button(action: { isLogin = true }) {
                            VStack(spacing: 8) {
                                Text("Login")
                                    .fontWeight(.bold)
                                    .foregroundColor(isLogin ? primaryBlue : .gray)
                                Rectangle()
                                    .fill(isLogin ? primaryBlue : Color.clear)
                                    .frame(height: 3)
                            }
                        }
                        
                        Button(action: { isLogin = false }) {
                            VStack(spacing: 8) {
                                Text("Sign Up")
                                    .fontWeight(.bold)
                                    .foregroundColor(!isLogin ? primaryBlue : .gray)
                                Rectangle()
                                    .fill(!isLogin ? primaryBlue : Color.clear)
                                    .frame(height: 3)
                            }
                        }
                    }
                    .frame(height: 45)
                    .padding(.horizontal, 40)
                    .padding(.top, 10)
                    
                    // Form Fields Card
                    VStack(spacing: 16) {
                        if !isLogin {
                            CustomTextField(icon: "person.fill", placeholder: "Full Name", text: $name)
                        }
                        
                        CustomTextField(icon: "envelope.fill", placeholder: "Email Address", text: $email)
                            .keyboardType(.emailAddress)
                            .autocapitalization(.none)
                        
                        CustomSecureField(placeholder: "Password", text: $password)
                        
                        if isLogin {
                            // Forgot Password Link
                            HStack {
                                Spacer()
                                Button(action: { showingForgotAlert = true }) {
                                    Text("Forgot Password?")
                                        .font(.footnote)
                                        .fontWeight(.semibold)
                                        .foregroundColor(primaryBlue)
                                }
                            }
                            .padding(.top, 4)
                        }
                        
                        if !isLogin {
                            CustomTextField(icon: "phone.fill", placeholder: "Phone Number", text: $phone)
                                .keyboardType(.phonePad)
                            
                            // Role Picker
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Register As")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(SBRColors.textPrimary)
                                
                                HStack(spacing: 0) {
                                    Button(action: { selectedRole = .customer }) {
                                        Text("Customer / Client")
                                            .font(.footnote)
                                            .fontWeight(.bold)
                                            .foregroundColor(selectedRole == .customer ? .white : SBRColors.textPrimary)
                                            .frame(maxWidth: .infinity)
                                            .padding(.vertical, 10)
                                            .background(selectedRole == .customer ? primaryBlue : Color.gray.opacity(0.1))
                                    }
                                    
                                    Button(action: { selectedRole = .agent }) {
                                        Text("Service Agent")
                                            .font(.footnote)
                                            .fontWeight(.bold)
                                            .foregroundColor(selectedRole == .agent ? .white : SBRColors.textPrimary)
                                            .frame(maxWidth: .infinity)
                                            .padding(.vertical, 10)
                                            .background(selectedRole == .agent ? primaryBlue : Color.gray.opacity(0.1))
                                    }
                                }
                                .cornerRadius(8)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 8)
                                        .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                                )
                            }
                            .padding(.top, 4)
                        }
                    }
                    .padding(24)
                    .background(Color.white)
                    .cornerRadius(16)
                    .shadow(color: Color.black.opacity(0.04), radius: 10, x: 0, y: 4)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.black.opacity(0.04), lineWidth: 1)
                    )
                    
                    // Error Display
                    if let error = authVM.errorMessage {
                        HStack(spacing: 6) {
                            Image(systemName: "exclamationmark.circle.fill")
                                .foregroundColor(.red)
                                .font(.footnote)
                            Text(error)
                                .foregroundColor(.red)
                                .font(.footnote)
                                .multilineTextAlignment(.center)
                        }
                        .padding(.horizontal)
                    }
                    
                    // Action Button (Sign In / Sign Up)
                    Button(action: {
                        Task {
                            let fcmToken = UserDefaults.standard.string(forKey: "fcm_token")
                            if isLogin {
                                await authVM.login(email: email, password: password, fcmToken: fcmToken)
                            } else {
                                await authVM.register(name: name, email: email, password: password, role: selectedRole, phone: phone)
                            }
                        }
                    }) {
                        HStack {
                            Spacer()
                            if authVM.isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            } else {
                                Text(isLogin ? "Sign In" : "Create Account")
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                            }
                            Spacer()
                        }
                        .padding(.vertical, 14)
                        .background(primaryBlue)
                        .cornerRadius(10)
                        .shadow(color: primaryBlue.opacity(0.2), radius: 6, x: 0, y: 3)
                    }
                    .disabled(authVM.isLoading)
                    
                    Spacer()
                }
                .padding(.horizontal, 24)
            }
        }
        .alert("Forgot Password", isPresented: $showingForgotAlert) {
            Button("OK", role: .cancel) {}
        } message: {
            Text("Please contact Sri Balaji Renewables administrator support helpline at admin@sbr.com to reset your credentials.")
        }
    }
}

// Custom text field with clean light-theme border
struct CustomTextField: View {
    let icon: String
    let placeholder: String
    @Binding var text: String
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.gray)
                .frame(width: 20)
            
            ZStack(alignment: .leading) {
                if text.isEmpty {
                    Text(placeholder)
                        .foregroundColor(Color.gray.opacity(0.7)) // High contrast placeholder
                }
                TextField("", text: $text)
                    .foregroundColor(.black)
            }
        }
        .padding(.vertical, 12)
        .padding(.horizontal, 16)
        .background(Color(red: 0.98, green: 0.98, blue: 0.99))
        .cornerRadius(10)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.gray.opacity(0.2), lineWidth: 1)
        )
    }
}

struct CustomSecureField: View {
    let placeholder: String
    @Binding var text: String
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "lock.fill")
                .foregroundColor(.gray)
                .frame(width: 20)
            
            ZStack(alignment: .leading) {
                if text.isEmpty {
                    Text(placeholder)
                        .foregroundColor(Color.gray.opacity(0.7)) // High contrast placeholder
                }
                SecureField("", text: $text)
                    .foregroundColor(.black)
            }
        }
        .padding(.vertical, 12)
        .padding(.horizontal, 16)
        .background(Color(red: 0.98, green: 0.98, blue: 0.99))
        .cornerRadius(10)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.gray.opacity(0.2), lineWidth: 1)
        )
    }
}

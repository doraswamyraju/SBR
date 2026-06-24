import Foundation

enum UserRole: String, Codable {
    case admin = "ADMIN"
    case agent = "AGENT"
    case customer = "CUSTOMER"
}

struct User: Codable, Identifiable {
    let id: String
    let name: String
    let email: String
    let role: UserRole
    let phone: String?
    let address: String?
    let photoUrl: String?
    let isRecurring: Bool?
    let nextServiceDate: String?
    let specialization: String?
    let location: String?
    let status: String?
    let rating: Double?
    let completedJobs: Int?
    let currentLat: Double?
    let currentLng: Double?
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case name, email, role, phone, address, photoUrl, isRecurring, nextServiceDate, specialization, location, status, rating, completedJobs, currentLat, currentLng
    }
}

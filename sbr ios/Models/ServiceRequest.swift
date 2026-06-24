import Foundation

struct LocationPoint: Codable {
    let latitude: Double
    let longitude: Double
    let timestamp: Date?
}

enum RequestStatus: String, Codable {
    case pending = "Pending"
    case assigned = "Assigned"
    case accepted = "Accepted"
    case inProgress = "In Progress"
    case completed = "Completed"
    case cancelled = "Cancelled"
}

struct ServiceRequest: Codable, Identifiable {
    let id: String
    let customerId: User?
    let assignedAgentId: User?
    let serviceType: String
    let description: String?
    let customerAddress: String
    let status: RequestStatus
    let createdBy: String
    let acceptedAt: String?
    let completedAt: String?
    let beforeImageUrl: String?
    let afterImageUrl: String?
    let paymentAmount: Double?
    let paymentStatus: String?
    let paymentMethod: String?
    let paymentTimestamp: String?
    let locationPath: [LocationPoint]?
    let createdAt: String
    let updatedAt: String
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case customerId, assignedAgentId, serviceType, description, customerAddress, status, createdBy, acceptedAt, completedAt, beforeImageUrl, afterImageUrl, paymentAmount, paymentStatus, paymentMethod, paymentTimestamp, locationPath, createdAt, updatedAt
    }
}

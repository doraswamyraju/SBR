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
        case id
        case _id
        case customerId, assignedAgentId, serviceType, description, customerAddress, status, createdBy, acceptedAt, completedAt, beforeImageUrl, afterImageUrl, paymentAmount, paymentStatus, paymentMethod, paymentTimestamp, locationPath, createdAt, updatedAt
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        // Handle id decoding fallback to ensure parsing compatibility with all endpoints
        if let decodedId = try container.decodeIfPresent(String.self, forKey: .id) {
            self.id = decodedId
        } else if let decodedUnderscoreId = try container.decodeIfPresent(String.self, forKey: ._id) {
            self.id = decodedUnderscoreId
        } else {
            throw DecodingError.keyNotFound(CodingKeys.id, DecodingError.Context(codingPath: container.codingPath, debugDescription: "Key id or _id not found in payload"))
        }
        
        self.customerId = try container.decodeIfPresent(User.self, forKey: .customerId)
        self.assignedAgentId = try container.decodeIfPresent(User.self, forKey: .assignedAgentId)
        self.serviceType = try container.decode(String.self, forKey: .serviceType)
        self.description = try container.decodeIfPresent(String.self, forKey: .description)
        self.customerAddress = try container.decode(String.self, forKey: .customerAddress)
        self.status = try container.decode(RequestStatus.self, forKey: .status)
        self.createdBy = try container.decode(String.self, forKey: .createdBy)
        self.acceptedAt = try container.decodeIfPresent(String.self, forKey: .acceptedAt)
        self.completedAt = try container.decodeIfPresent(String.self, forKey: .completedAt)
        self.beforeImageUrl = try container.decodeIfPresent(String.self, forKey: .beforeImageUrl)
        self.afterImageUrl = try container.decodeIfPresent(String.self, forKey: .afterImageUrl)
        self.paymentAmount = try container.decodeIfPresent(Double.self, forKey: .paymentAmount)
        self.paymentStatus = try container.decodeIfPresent(String.self, forKey: .paymentStatus)
        self.paymentMethod = try container.decodeIfPresent(String.self, forKey: .paymentMethod)
        self.paymentTimestamp = try container.decodeIfPresent(String.self, forKey: .paymentTimestamp)
        self.locationPath = try container.decodeIfPresent([LocationPoint].self, forKey: .locationPath)
        self.createdAt = try container.decode(String.self, forKey: .createdAt)
        self.updatedAt = try container.decode(String.self, forKey: .updatedAt)
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encodeIfPresent(customerId, forKey: .customerId)
        try container.encodeIfPresent(assignedAgentId, forKey: .assignedAgentId)
        try container.encode(serviceType, forKey: .serviceType)
        try container.encodeIfPresent(description, forKey: .description)
        try container.encode(customerAddress, forKey: .customerAddress)
        try container.encode(status, forKey: .status)
        try container.encode(createdBy, forKey: .createdBy)
        try container.encodeIfPresent(acceptedAt, forKey: .acceptedAt)
        try container.encodeIfPresent(completedAt, forKey: .completedAt)
        try container.encodeIfPresent(beforeImageUrl, forKey: .beforeImageUrl)
        try container.encodeIfPresent(afterImageUrl, forKey: .afterImageUrl)
        try container.encodeIfPresent(paymentAmount, forKey: .paymentAmount)
        try container.encodeIfPresent(paymentStatus, forKey: .paymentStatus)
        try container.encodeIfPresent(paymentMethod, forKey: .paymentMethod)
        try container.encodeIfPresent(paymentTimestamp, forKey: .paymentTimestamp)
        try container.encodeIfPresent(locationPath, forKey: .locationPath)
        try container.encode(createdAt, forKey: .createdAt)
        try container.encode(updatedAt, forKey: .updatedAt)
    }
}

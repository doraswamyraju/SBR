import Foundation

enum IndentStatus: String, Codable {
    case requested = "REQUESTED"
    case pending = "PENDING"
    case approved = "APPROVED"
    case dispatched = "DISPATCHED"
    case rejected = "REJECTED"
    
    var displayName: String {
        switch self {
        case .requested, .pending: return "Pending Store Review"
        case .approved: return "Approved"
        case .dispatched: return "Dispatched to Van"
        case .rejected: return "Rejected"
        }
    }
}

struct IndentItem: Codable, Identifiable {
    var id: String { productId ?? name }
    let posProductId: Int?
    let productId: String?
    let name: String
    let sku: String?
    let requestedQuantity: Int
    let dispatchedQuantity: Int?
    
    enum CodingKeys: String, CodingKey {
        case posProductId, productId, productName, name, sku, requestedQuantity, quantity, dispatchedQuantity
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.posProductId = try? container.decodeIfPresent(Int.self, forKey: .posProductId)
        
        // Handle productId as string or object
        if let prodStr = try? container.decodeIfPresent(String.self, forKey: .productId) {
            self.productId = prodStr
        } else {
            self.productId = nil
        }
        
        let pName = (try? container.decodeIfPresent(String.self, forKey: .productName))
            ?? (try? container.decodeIfPresent(String.self, forKey: .name))
            ?? "Spare Part"
        self.name = pName
        
        self.sku = try? container.decodeIfPresent(String.self, forKey: .sku)
        self.requestedQuantity = (try? container.decodeIfPresent(Int.self, forKey: .requestedQuantity))
            ?? (try? container.decodeIfPresent(Int.self, forKey: .quantity))
            ?? 1
        self.dispatchedQuantity = try? container.decodeIfPresent(Int.self, forKey: .dispatchedQuantity)
    }
    
    init(posProductId: Int? = nil, productId: String? = nil, name: String, sku: String? = nil, requestedQuantity: Int = 1, dispatchedQuantity: Int? = nil) {
        self.posProductId = posProductId
        self.productId = productId
        self.name = name
        self.sku = sku
        self.requestedQuantity = requestedQuantity
        self.dispatchedQuantity = dispatchedQuantity
    }
}

struct AgentIndent: Codable, Identifiable {
    var id: String { _id ?? UUID().uuidString }
    let _id: String?
    let agentId: HandoverAgent?
    let serviceRequestId: String?
    let items: [IndentItem]
    let status: IndentStatus
    let urgency: String?
    let agentRemarks: String?
    let inchargeRemarks: String?
    let storeInchargeId: HandoverAgent?
    let requestedAt: String?
    let dispatchedAt: String?
    let createdAt: String?
    let updatedAt: String?
    
    enum CodingKeys: String, CodingKey {
        case _id, id, agentId, serviceRequestId, requestId, items, status, urgency, agentRemarks, inchargeRemarks, storeInchargeId, dispatchedBy, requestedAt, dispatchedAt, createdAt, updatedAt
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self._id = (try? container.decodeIfPresent(String.self, forKey: ._id)) ?? (try? container.decodeIfPresent(String.self, forKey: .id))
        self.agentId = try? container.decodeIfPresent(HandoverAgent.self, forKey: .agentId)
        self.serviceRequestId = (try? container.decodeIfPresent(String.self, forKey: .serviceRequestId)) ?? (try? container.decodeIfPresent(String.self, forKey: .requestId))
        self.items = (try? container.decodeIfPresent([IndentItem].self, forKey: .items)) ?? []
        
        if let rawStatus = try? container.decodeIfPresent(String.self, forKey: .status),
           let parsedStatus = IndentStatus(rawValue: rawStatus.uppercased()) {
            self.status = parsedStatus
        } else {
            self.status = .requested
        }
        
        self.urgency = try? container.decodeIfPresent(String.self, forKey: .urgency)
        self.agentRemarks = try? container.decodeIfPresent(String.self, forKey: .agentRemarks)
        self.inchargeRemarks = try? container.decodeIfPresent(String.self, forKey: .inchargeRemarks)
        self.storeInchargeId = (try? container.decodeIfPresent(HandoverAgent.self, forKey: .storeInchargeId)) ?? (try? container.decodeIfPresent(HandoverAgent.self, forKey: .dispatchedBy))
        self.requestedAt = try? container.decodeIfPresent(String.self, forKey: .requestedAt)
        self.dispatchedAt = try? container.decodeIfPresent(String.self, forKey: .dispatchedAt)
        self.createdAt = try? container.decodeIfPresent(String.self, forKey: .createdAt)
        self.updatedAt = try? container.decodeIfPresent(String.self, forKey: .updatedAt)
    }
}

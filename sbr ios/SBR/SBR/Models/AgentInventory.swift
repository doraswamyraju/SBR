import Foundation

struct AgentInventoryItem: Codable, Identifiable {
    var id: String { _id ?? UUID().uuidString }
    let _id: String?
    let agentId: String?
    let posProductId: Int?
    let productId: String?
    let productName: String
    let sku: String?
    let category: String?
    let quantity: Int
    let minThreshold: Int?
    let unitPrice: Double?
    let lastUpdated: String?
    let createdAt: String?
    let updatedAt: String?
    
    var isLowStock: Bool {
        return quantity <= (minThreshold ?? 1)
    }
    
    var displayName: String {
        return productName
    }
    
    enum CodingKeys: String, CodingKey {
        case _id, id, agentId, posProductId, productId, productName, name, sku, category, quantity, minThreshold, minAlertThreshold, unitPrice, price, lastUpdated, createdAt, updatedAt
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self._id = (try? container.decodeIfPresent(String.self, forKey: ._id)) ?? (try? container.decodeIfPresent(String.self, forKey: .id))
        
        // agentId can be string or populated user object
        if let agentStr = try? container.decodeIfPresent(String.self, forKey: .agentId) {
            self.agentId = agentStr
        } else {
            self.agentId = nil
        }
        
        self.posProductId = try? container.decodeIfPresent(Int.self, forKey: .posProductId)
        
        // productId can be string id or null
        if let prodStr = try? container.decodeIfPresent(String.self, forKey: .productId) {
            self.productId = prodStr
        } else {
            self.productId = nil
        }
        
        let pName = (try? container.decodeIfPresent(String.self, forKey: .productName))
            ?? (try? container.decodeIfPresent(String.self, forKey: .name))
            ?? "Component / Part"
        self.productName = pName
        
        self.sku = try? container.decodeIfPresent(String.self, forKey: .sku)
        self.category = try? container.decodeIfPresent(String.self, forKey: .category)
        self.quantity = (try? container.decodeIfPresent(Int.self, forKey: .quantity)) ?? 0
        self.minThreshold = (try? container.decodeIfPresent(Int.self, forKey: .minThreshold))
            ?? (try? container.decodeIfPresent(Int.self, forKey: .minAlertThreshold))
            ?? 1
        self.unitPrice = (try? container.decodeIfPresent(Double.self, forKey: .unitPrice))
            ?? (try? container.decodeIfPresent(Double.self, forKey: .price))
        self.lastUpdated = try? container.decodeIfPresent(String.self, forKey: .lastUpdated)
        self.createdAt = try? container.decodeIfPresent(String.self, forKey: .createdAt)
        self.updatedAt = try? container.decodeIfPresent(String.self, forKey: .updatedAt)
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encodeIfPresent(_id, forKey: ._id)
        try container.encodeIfPresent(agentId, forKey: .agentId)
        try container.encodeIfPresent(posProductId, forKey: .posProductId)
        try container.encodeIfPresent(productId, forKey: .productId)
        try container.encode(productName, forKey: .productName)
        try container.encodeIfPresent(sku, forKey: .sku)
        try container.encodeIfPresent(category, forKey: .category)
        try container.encode(quantity, forKey: .quantity)
        try container.encodeIfPresent(minThreshold, forKey: .minThreshold)
        try container.encodeIfPresent(unitPrice, forKey: .unitPrice)
        try container.encodeIfPresent(lastUpdated, forKey: .lastUpdated)
        try container.encodeIfPresent(createdAt, forKey: .createdAt)
        try container.encodeIfPresent(updatedAt, forKey: .updatedAt)
    }
}

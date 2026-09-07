import Foundation

struct ProductRef: Codable, Identifiable {
    var id: String { _id ?? "" }
    let _id: String?
    let name: String
    let sku: String?
    let price: Double?
    let stockLevel: Int?
    let minStockLevel: Int?
}

struct AgentInventoryItem: Codable, Identifiable {
    var id: String { _id ?? "" }
    let _id: String?
    let agentId: String?
    let productId: ProductRef?
    let quantity: Int
    let minAlertThreshold: Int
    let lastRestockedAt: String?
    let createdAt: String?
    let updatedAt: String?
    
    var isLowStock: Bool {
        return quantity <= minAlertThreshold
    }
}

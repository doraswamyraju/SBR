import Foundation
import Combine

@MainActor
class ProductsViewModel: ObservableObject {
    @Published var products: [Product] = []
    @Published var isLoading = false
    @Published var errorMessage: String? = nil
    
    // Support category filters and search terms
    @Published var selectedCategory: String = "All"
    @Published var searchQuery: String = ""
    
    func fetchProducts() async {
        isLoading = true
        errorMessage = nil
        
        // Build query parameters
        var endpoint = "api/products"
        var queryItems: [URLQueryItem] = []
        
        // Add activeOnly = false by default to match android API usage
        queryItems.append(URLQueryItem(name: "activeOnly", value: "false"))
        
        if selectedCategory != "All" {
            queryItems.append(URLQueryItem(name: "category", value: selectedCategory))
        }
        
        if !queryItems.isEmpty {
            var components = URLComponents(string: endpoint)
            components?.queryItems = queryItems
            if let pathWithQuery = components?.percentEncodedQuery {
                endpoint = "api/products?\(pathWithQuery)"
            }
        }
        
        do {
            let res = try await APIClient.shared.get(endpoint: endpoint, responseType: APIResponse<[Product]>.self)
            if res.success, let data = res.data {
                self.products = data
            } else {
                self.errorMessage = res.error ?? "Failed to fetch products"
            }
        } catch {
            self.errorMessage = error.localizedDescription
        }
        isLoading = false
    }
    
    func createProduct(_ request: ProductRequest) async -> Bool {
        isLoading = true
        errorMessage = nil
        do {
            let res = try await APIClient.shared.post(endpoint: "api/products/admin", body: request, responseType: APIResponse<Product>.self)
            if res.success {
                await fetchProducts()
                isLoading = false
                return true
            } else {
                self.errorMessage = res.error ?? "Failed to create product"
            }
        } catch {
            self.errorMessage = error.localizedDescription
        }
        isLoading = false
        return false
    }
    
    func updateProduct(id: String, _ request: ProductRequest) async -> Bool {
        isLoading = true
        errorMessage = nil
        do {
            let res = try await APIClient.shared.put(endpoint: "api/products/admin/\(id)", body: request, responseType: APIResponse<Product>.self)
            if res.success {
                await fetchProducts()
                isLoading = false
                return true
            } else {
                self.errorMessage = res.error ?? "Failed to update product"
            }
        } catch {
            self.errorMessage = error.localizedDescription
        }
        isLoading = false
        return false
    }
    
    func deleteProduct(id: String) async -> Bool {
        isLoading = true
        errorMessage = nil
        do {
            struct DeleteResponse: Codable {
                let success: Bool
                let error: String?
            }
            let res = try await APIClient.shared.delete(endpoint: "api/products/admin/\(id)", responseType: DeleteResponse.self)
            if res.success {
                await fetchProducts()
                isLoading = false
                return true
            } else {
                self.errorMessage = res.error ?? "Failed to delete product"
            }
        } catch {
            self.errorMessage = error.localizedDescription
        }
        isLoading = false
        return false
    }
}

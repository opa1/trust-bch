import axios, { type AxiosInstance, type AxiosError } from "axios";
import { toast } from "./toast-utils";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true, // Enable sending cookies
    });
  }

  // Escrow API methods
  async createEscrow(data: any) {
    try {
      // Transform frontend field names to backend field names
      const requestData = {
        receiverEmail: data.sellerEmail,
        amount: data.amountBCH,
        description: data.description,
        expiryHours: data.expiryHours,
      };

      const response = await this.client.post("/escrow/create", requestData);
      toast.success("Escrow created successfully");
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to create escrow");
      throw error;
    }
  }

  async updateEscrow(id: string, data: any) {
    try {
      const response = await this.client.patch(`/escrow/${id}`, data);
      toast.success("Escrow updated successfully");
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to update escrow");
      throw error;
    }
  }

  async getEscrows() {
    try {
      const response = await this.client.get("/escrow/list");
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to fetch escrows");
      throw error;
    }
  }

  async getUserEscrows() {
    try {
      const response = await this.client.get("/escrow/list");
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to fetch your escrows");
      throw error;
    }
  }

  async getEscrow(id: string) {
    try {
      const response = await this.client.get(`/escrow/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to fetch escrow");
      throw error;
    }
  }

  async getEscrowStatus(escrowId: string) {
    try {
      const response = await this.client.get(`/escrow/status?id=${escrowId}`);
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to check escrow status");
      throw error;
    }
  }

  async cancelEscrow(escrowId: string) {
    try {
      const response = await this.client.post("/escrow/cancel", { escrowId });
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to cancel escrow");
      throw error;
    }
  }

  async releaseEscrow(escrowId: string) {
    try {
      const response = await this.client.post("/escrow/release", { escrowId });
      toast.success("Escrow released successfully");
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to release escrow");
      throw error;
    }
  }

  async refundEscrow(escrowId: string) {
    try {
      const response = await this.client.post("/escrow/refund", { escrowId });
      toast.success("Escrow refunded successfully");
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to refund escrow");
      throw error;
    }
  }

  async startEscrowWork(escrowId: string) {
    try {
      const response = await this.client.post("/escrow/start", { escrowId });
      toast.success("Work started");
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to start work");
      throw error;
    }
  }

  async submitEscrowWork(escrowId: string, description?: string) {
    try {
      const response = await this.client.post("/escrow/submit", {
        escrowId,
        description,
      });
      toast.success("Work submitted successfully");
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to submit work");
      throw error;
    }
  }

  // Agent API methods
  async getAgents() {
    try {
      // Note: Agent routes may not be implemented yet
      const response = await this.client.get("/agents");
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to fetch agents");
      throw error;
    }
  }

  async applyAsAgent(data: any) {
    try {
      const response = await this.client.post("/agents/apply", data);
      toast.success("Agent application submitted");
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to submit agent application");
      throw error;
    }
  }

  // Dispute API methods
  async createDispute(escrowId: string, data: any) {
    try {
      const response = await this.client.post(`/dispute/open`, {
        ...data,
        escrowId,
      });
      toast.success("Dispute created successfully");
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to create dispute");
      throw error;
    }
  }

  async getDisputes() {
    try {
      const response = await this.client.get("/disputes");
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to fetch disputes");
      throw error;
    }
  }

  async resolveDispute(id: string, resolution: any) {
    try {
      const response = await this.client.post(`dispute/${id}`, resolution);
      toast.success("Dispute resolved successfully");
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to resolve dispute");
      throw error;
    }
  }

  // Auth methods
  async login(credentials: { email: string; password: string }) {
    try {
      const response = await this.client.post("/auth/login", credentials);
      toast.success("Logged in successfully");
      return response.data.data;
    } catch (error) {
      this.handleError(error, "Login failed");
      throw error;
    }
  }

  async register(data: any) {
    try {
      const response = await this.client.post("/auth/register", data);
      toast.success("Registration successful");
      return response.data.data;
    } catch (error) {
      this.handleError(error, "Registration failed");
      throw error;
    }
  }

  async logout() {
    try {
      await this.client.post("/auth/logout");
      toast.success("Logged out successfully");
    } catch (error) {
      this.handleError(error, "Logout failed");
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const response = await this.client.get("/auth/me");
      return response.data.data;
    } catch (error) {
      // Don't show error toast for getCurrentUser (expected to fail if not logged in)
      throw error;
    }
  }

  async updateProfile(data: {
    fullName?: string;
    email?: string;
    password?: string;
  }) {
    try {
      const response = await this.client.patch("/auth/me", data);
      toast.success("Profile updated successfully");
      return response.data.data;
    } catch (error) {
      this.handleError(error, "Failed to update profile");
      throw error;
    }
  }

  // Helper to extract user-friendly message from error
  public getErrorMessage(error: any): string {
    if (axios.isAxiosError(error) && error.response?.data) {
      if (error.response.data.error?.message) {
        return error.response.data.error.message;
      }
      if (error.response.data.message) {
        return error.response.data.message;
      }
    }
    if (error instanceof Error) {
      return error.message;
    }
    return "An unexpected error occurred";
  }

  // Error handler
  private handleError(error: any, defaultMessage: string) {
    const message = this.getErrorMessage(error);

    // Check if this is a generic HTTP status code error
    const statusCodeMatch = message.match(
      /Request failed with status code (\d+)/,
    );

    if (statusCodeMatch) {
      const statusCode = parseInt(statusCodeMatch[1]);
      let userMessage = defaultMessage;

      switch (statusCode) {
        case 400:
          userMessage =
            "Invalid request. Please check your input and try again.";
          break;
        case 401:
          userMessage = "Authentication failed. Please check your credentials.";
          break;
        case 403:
          userMessage = "You don't have permission to perform this action.";
          break;
        case 404:
          userMessage =
            "Service not found. Please contact support if this persists.";
          break;
        case 409:
          userMessage =
            "This action conflicts with existing data. Please try again.";
          break;
        case 422:
          userMessage = "Invalid data provided. Please check your input.";
          break;
        case 429:
          userMessage =
            "Too many requests. Please wait a moment and try again.";
          break;
        case 500:
        case 502:
        case 503:
          userMessage = "Server error. Please try again later.";
          break;
        default:
          userMessage = defaultMessage;
      }

      toast.error("Error", userMessage);
    } else {
      // Use the extracted detailed message if available
      toast.error("Error", message);
    }
  }

  async addDisputeEvidence(
    disputeId: string,
    content: string,
    type: "text" | "image" | "file" = "text",
  ) {
    try {
      const response = await this.client.post(
        `/dispute/${disputeId}/evidence`,
        {
          content,
          type,
        },
      );
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to add evidence");
      throw error;
    }
  }

  async getDispute(disputeId: string) {
    try {
      const response = await this.client.get(`/dispute/${disputeId}`);
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to load dispute");
      throw error;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

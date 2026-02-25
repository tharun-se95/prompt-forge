use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub enum PromptForgeError {
    #[serde(rename = "io_error")]
    IoError(String),
    #[serde(rename = "validation_error")]
    ValidationError(String),
    #[serde(rename = "store_error")]
    StoreError(String),
}

impl std::fmt::Display for PromptForgeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::IoError(msg) => write!(f, "IO Error: {}", msg),
            Self::ValidationError(msg) => write!(f, "Validation Error: {}", msg),
            Self::StoreError(msg) => write!(f, "Store Error: {}", msg),
        }
    }
}

impl std::error::Error for PromptForgeError {}

// Automatically convert tauri_plugin_store::Error into PromptForgeError::StoreError
impl From<tauri_plugin_store::Error> for PromptForgeError {
    fn from(error: tauri_plugin_store::Error) -> Self {
        PromptForgeError::StoreError(error.to_string())
    }
}

// Automatically convert std::io::Error into PromptForgeError::IoError
impl From<std::io::Error> for PromptForgeError {
    fn from(error: std::io::Error) -> Self {
        PromptForgeError::IoError(error.to_string())
    }
}

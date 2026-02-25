use serde_json::json;
use tauri::{AppHandle, Manager};
use tauri_plugin_store::StoreExt;
use crate::models::{Snippet, SnippetStore, NewSnippetPayload};
use crate::error::PromptForgeError;

const SNIPPETS_FILE: &str = "snippets.json";

#[tauri::command]
pub async fn load_snippets(
    app: AppHandle,
) -> Result<SnippetStore, PromptForgeError> {
    log::info!("Loading snippets from store");

    // Attempt to load the store using the v2 AppHandle extension
    let store = match app.store(SNIPPETS_FILE) {
        Ok(s) => s,
        Err(e) => return Err(PromptForgeError::StoreError(e.to_string())),
    };
    
    // In v2, the store is loaded automatically if it's the first time
    // But we use store.get directly.
    
    let snippets_value = store.get("snippets").unwrap_or(json!([]));

    let snippets: Vec<Snippet> = serde_json::from_value(snippets_value)
        .map_err(|e| PromptForgeError::ValidationError(format!("Failed to parse snippets: {}", e)))?;

    Ok(SnippetStore { snippets })
}

#[tauri::command]
pub async fn add_snippet(
    app: AppHandle,
    payload: NewSnippetPayload,
) -> Result<Snippet, PromptForgeError> {
    log::info!("Adding new snippet: {}", payload.title);

    // 1. Validate
    if payload.title.trim().is_empty() {
        return Err(PromptForgeError::ValidationError("Title cannot be empty".into()));
    }

    // 2. Create the model
    let new_snippet = Snippet::new(payload);

    // 3. Load Store
    let store = match app.store(SNIPPETS_FILE) {
        Ok(s) => s,
        Err(e) => return Err(PromptForgeError::StoreError(e.to_string())),
    };

    // 4. Update
    let snippets_value = store.get("snippets").unwrap_or(json!([]));
    let mut snippets: Vec<Snippet> = serde_json::from_value(snippets_value)
         .map_err(|e| PromptForgeError::ValidationError(format!("Parse error: {}", e)))?;
    
    snippets.push(new_snippet.clone());

    // 5. Save Model
    store.set("snippets", json!(snippets));
    store.save()?;

    Ok(new_snippet)
}

#[tauri::command]
pub async fn delete_snippet(
    app: AppHandle,
    id: String,
) -> Result<(), PromptForgeError> {
    log::info!("Deleting snippet: {}", id);

    let store = match app.store(SNIPPETS_FILE) {
        Ok(s) => s,
        Err(e) => return Err(PromptForgeError::StoreError(e.to_string())),
    };

    let snippets_value = store.get("snippets").unwrap_or(json!([]));
    let mut snippets: Vec<Snippet> = serde_json::from_value(snippets_value)
         .map_err(|_| PromptForgeError::ValidationError("Parse error".into()))?;

    // Filter out the deleted ID
    snippets.retain(|s| s.id != id);

    store.set("snippets", json!(snippets));
    store.save()?;

    Ok(())
}

use serde::{Serialize, Deserialize};
use uuid::Uuid;
use chrono::Utc;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Snippet {
    pub id: String,
    pub title: String,
    pub content: String,
    pub tags: Vec<String>,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SnippetStore {
    pub snippets: Vec<Snippet>,
}

#[derive(Debug, Deserialize)]
pub struct NewSnippetPayload {
    pub title: String,
    pub content: String,
    pub tags: Option<Vec<String>>,
}

impl Snippet {
    pub fn new(payload: NewSnippetPayload) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            title: payload.title,
            content: payload.content,
            tags: payload.tags.unwrap_or_default(),
            updated_at: Utc::now().to_rfc3339(),
        }
    }
}


const SUPABASE_URL = "https://opdggjtwjdglninmyaoi.supabase.co/rest/v1/";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_5W0COuWIv-xmFTxcYAV6zQ_1uw82nSz";

window.academicSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

// Test whether the website can read the public questions table.
window.academicSupabase
    .from("questions")
    .select("id")
    .limit(1)
    .then(function({ data, error }) {
        if (error) {
            console.error("Supabase connection test failed:", error.message);
            return;
        }

        console.log(
            "Supabase connection successful! Rows returned:",
            data.length
        );
    });

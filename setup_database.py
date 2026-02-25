#!/usr/bin/env python3
"""
Starlink WiFi - Complete Database Setup Script
Reads and displays the SQL schema for manual execution
"""

import webbrowser
import os

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*70}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}{text.center(70)}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'='*70}{Colors.END}\n")

def print_success(text):
    print(f"{Colors.GREEN}✅ {text}{Colors.END}")

def print_error(text):
    print(f"{Colors.RED}❌ {text}{Colors.END}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.END}")

def print_info(text):
    print(f"{Colors.BLUE}ℹ️  {text}{Colors.END}")

def print_step(number, text):
    print(f"{Colors.BOLD}{Colors.CYAN}Step {number}:{Colors.END} {text}")

def main():
    print(f"\n{Colors.BOLD}{Colors.BLUE}")
    print("╔══════════════════════════════════════════════════════════════════╗")
    print("║        Starlink WiFi - Database Setup Instructions              ║")
    print("╚══════════════════════════════════════════════════════════════════╝")
    print(Colors.END)
    
    print_warning("The Supabase REST API has limitations for creating complex schemas")
    print_info("We need to use the Supabase SQL Editor for proper table creation")
    
    print_header("Current Database Status")
    
    print_success("Tables that exist (but may need schema updates):")
    print("  • gallery")
    print("  • messages")
    print("  • notifications")
    print("  • admins")
    
    print_error("\nTables that need to be created:")
    print("  • bundles")
    
    print_warning("\nAll tables need proper columns, indexes, and triggers")
    
    print_header("Setup Instructions")
    
    print_step(1, "Open Supabase Dashboard")
    print(f"   URL: {Colors.CYAN}https://jgaeldguwezbgglwaivz.supabase.co{Colors.END}")
    
    print_step(2, "Navigate to SQL Editor")
    print("   • Click 'SQL Editor' in the left sidebar")
    print("   • Click 'New Query' button")
    
    print_step(3, "Copy the SQL Schema")
    print("   • Open the file: supabase-schema.sql")
    print("   • Copy ALL the contents")
    
    print_step(4, "Paste and Execute")
    print("   • Paste the SQL into the Supabase SQL Editor")
    print("   • Click 'Run' or press Ctrl+Enter")
    print("   • Wait for completion (should take a few seconds)")
    
    print_step(5, "Verify Success")
    print("   • Check for success message")
    print("   • Look for any error messages")
    
    print_step(6, "Test the System")
    print("   • Run: python test_system.py")
    print("   • All tests should pass")
    
    print_header("Quick SQL Schema Preview")
    
    # Read and display first few lines of SQL
    try:
        with open('supabase-schema.sql', 'r', encoding='utf-8') as f:
            lines = f.readlines()[:20]
            print(f"{Colors.CYAN}First 20 lines of supabase-schema.sql:{Colors.END}\n")
            for i, line in enumerate(lines, 1):
                print(f"{Colors.YELLOW}{i:3d}{Colors.END} {line.rstrip()}")
            print(f"\n{Colors.CYAN}... (and {len(lines) - 20} more lines){Colors.END}")
            print_success(f"\nTotal SQL file size: {len(lines)} lines")
    except FileNotFoundError:
        print_error("supabase-schema.sql file not found!")
        print_info("Make sure you're in the correct directory")
    
    print_header("Alternative: Manual Table Creation")
    
    print("If you prefer, here's what each table needs:\n")
    
    print(f"{Colors.BOLD}1. BUNDLES TABLE:{Colors.END}")
    print("   • bundle_id (text, unique)")
    print("   • name (text)")
    print("   • price (decimal)")
    print("   • features (text array)")
    print("   • description (text)")
    print("   • visible (boolean)")
    
    print(f"\n{Colors.BOLD}2. GALLERY TABLE:{Colors.END}")
    print("   • title (text)")
    print("   • description (text)")
    print("   • url (text) - should be 'image_url'")
    print("   • filename (text)")
    print("   • category (text)")
    print("   • uploaded_by (text)")
    
    print(f"\n{Colors.BOLD}3. MESSAGES TABLE:{Colors.END}")
    print("   • name (text)")
    print("   • email (text)")
    print("   • phone (text)")
    print("   • service (text)")
    print("   • message (text)")
    print("   • read (boolean)")
    print("   • status (text)")
    
    print_header("What Happens Next?")
    
    print("After running the SQL schema, you'll have:")
    print_success("✓ All 5 tables created with proper structure")
    print_success("✓ Default bundles (Daily, Weekly, Monthly, Business)")
    print_success("✓ Default admin user (starlinktokenwifi@gmail.com)")
    print_success("✓ Indexes for better performance")
    print_success("✓ Triggers for automatic timestamps")
    print_success("✓ Row Level Security policies")
    
    print_header("Ready to Continue?")
    
    response = input(f"\n{Colors.BOLD}Open Supabase Dashboard now? (y/n): {Colors.END}").lower()
    
    if response == 'y':
        print_info("Opening Supabase Dashboard in your browser...")
        webbrowser.open("https://jgaeldguwezbgglwaivz.supabase.co")
        print_success("Dashboard opened!")
        
        input(f"\n{Colors.BOLD}Press Enter after you've run the SQL schema...{Colors.END}")
        
        print_info("\nRunning system test...")
        os.system("python test_system.py")
    else:
        print_info("\nNo problem! Run the SQL schema when you're ready")
        print_info("Then run: python test_system.py")
    
    print(f"\n{Colors.GREEN}{Colors.BOLD}Setup instructions complete!{Colors.END}\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Setup interrupted{Colors.END}\n")
    except Exception as e:
        print(f"\n{Colors.RED}Error: {str(e)}{Colors.END}\n")

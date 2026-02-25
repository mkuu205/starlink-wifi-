#!/usr/bin/env python3
"""
Starlink WiFi System Test Script
Tests all API endpoints and displays results
"""

import requests
import json
from datetime import datetime
import sys

# Configuration
API_BASE = "http://localhost:3000/api"
FRONTEND_BASE = "http://localhost:8000"

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
    """Print a formatted header"""
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}{text.center(60)}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'='*60}{Colors.END}\n")

def print_success(text):
    """Print success message"""
    print(f"{Colors.GREEN}✅ {text}{Colors.END}")

def print_error(text):
    """Print error message"""
    print(f"{Colors.RED}❌ {text}{Colors.END}")

def print_warning(text):
    """Print warning message"""
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.END}")

def print_info(text):
    """Print info message"""
    print(f"{Colors.BLUE}ℹ️  {text}{Colors.END}")

def test_backend_health():
    """Test backend health endpoint"""
    print_header("Testing Backend Health")
    try:
        response = requests.get(f"{API_BASE}/health", timeout=5)
        data = response.json()
        
        if data.get('success'):
            print_success("Backend server is running")
            print_info(f"Database: {data.get('database', 'unknown')}")
            print_info(f"Email: {data.get('email', 'unknown')}")
            print_info(f"Uptime: {data.get('uptime', 0):.2f} seconds")
            return True
        else:
            print_error("Backend returned error")
            return False
    except requests.exceptions.ConnectionError:
        print_error("Cannot connect to backend (is it running on port 3000?)")
        return False
    except Exception as e:
        print_error(f"Backend test failed: {str(e)}")
        return False

def test_gallery():
    """Test gallery endpoint"""
    print_header("Testing Gallery API")
    try:
        response = requests.get(f"{API_BASE}/gallery", timeout=5)
        data = response.json()
        
        if data.get('success'):
            count = data.get('count', 0)
            print_success(f"Gallery API working ({count} images found)")
            if count > 0:
                print_info(f"Sample image: {data['data'][0].get('title', 'Untitled')}")
            return True
        else:
            print_error(f"Gallery error: {data.get('message', 'Unknown error')}")
            print_warning("Database tables may not be created yet")
            return False
    except Exception as e:
        print_error(f"Gallery test failed: {str(e)}")
        return False

def test_bundles():
    """Test bundles endpoint"""
    print_header("Testing Bundles API")
    try:
        response = requests.get(f"{API_BASE}/bundles", timeout=5)
        data = response.json()
        
        if data.get('success'):
            count = data.get('count', 0)
            print_success(f"Bundles API working ({count} bundles found)")
            if count > 0:
                for bundle in data['data']:
                    print_info(f"  - {bundle.get('name')}: KSh {bundle.get('price')}")
            return True
        else:
            print_error(f"Bundles error: {data.get('message', 'Unknown error')}")
            print_warning("Database tables may not be created yet")
            return False
    except Exception as e:
        print_error(f"Bundles test failed: {str(e)}")
        return False

def test_messages():
    """Test messages endpoint"""
    print_header("Testing Messages API")
    try:
        response = requests.get(f"{API_BASE}/messages", timeout=5)
        data = response.json()
        
        if data.get('success'):
            count = data.get('count', 0)
            unread = data.get('unreadCount', 0)
            print_success(f"Messages API working ({count} total, {unread} unread)")
            return True
        else:
            print_error(f"Messages error: {data.get('message', 'Unknown error')}")
            print_warning("Database tables may not be created yet")
            return False
    except Exception as e:
        print_error(f"Messages test failed: {str(e)}")
        return False

def test_contact_form():
    """Test contact form submission"""
    print_header("Testing Contact Form")
    try:
        test_data = {
            "name": "Test User",
            "email": "test@example.com",
            "phone": "+254700000000",
            "service": "Daily Bundle",
            "message": f"Test message sent at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        }
        
        response = requests.post(
            f"{API_BASE}/contact",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        data = response.json()
        
        if data.get('success'):
            print_success("Contact form working - test message sent")
            print_info(f"Message ID: {data.get('data', {}).get('id', 'N/A')}")
            return True
        else:
            print_error(f"Contact form error: {data.get('message', 'Unknown error')}")
            return False
    except Exception as e:
        print_error(f"Contact form test failed: {str(e)}")
        return False

def test_frontend():
    """Test frontend server"""
    print_header("Testing Frontend Server")
    try:
        response = requests.get(FRONTEND_BASE, timeout=5)
        if response.status_code == 200:
            print_success("Frontend server is running")
            print_info(f"Main site: {FRONTEND_BASE}")
            print_info(f"Admin panel: {FRONTEND_BASE}/admin.html")
            print_info(f"Test page: {FRONTEND_BASE}/test-system.html")
            return True
        else:
            print_error(f"Frontend returned status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("Cannot connect to frontend (is it running on port 8000?)")
        return False
    except Exception as e:
        print_error(f"Frontend test failed: {str(e)}")
        return False

def print_summary(results):
    """Print test summary"""
    print_header("Test Summary")
    
    total = len(results)
    passed = sum(1 for r in results.values() if r)
    failed = total - passed
    
    print(f"{Colors.BOLD}Total Tests: {total}{Colors.END}")
    print_success(f"Passed: {passed}")
    if failed > 0:
        print_error(f"Failed: {failed}")
    
    print("\n" + Colors.BOLD + "Test Results:" + Colors.END)
    for test_name, result in results.items():
        status = f"{Colors.GREEN}✅ PASS{Colors.END}" if result else f"{Colors.RED}❌ FAIL{Colors.END}"
        print(f"  {test_name}: {status}")
    
    if failed > 0:
        print_warning("\nSome tests failed. Common issues:")
        print("  1. Database tables not created - run supabase-schema.sql")
        print("  2. Backend not running - check if port 3000 is in use")
        print("  3. Frontend not running - check if port 8000 is in use")
        print("\nSee TESTING-GUIDE.md for detailed troubleshooting")

def print_next_steps():
    """Print next steps"""
    print_header("Next Steps")
    print("1. Open test page in browser:")
    print(f"   {Colors.CYAN}{FRONTEND_BASE}/test-system.html{Colors.END}")
    print("\n2. Set up database (if tests failed):")
    print("   - Go to Supabase dashboard")
    print("   - Run SQL from supabase-schema.sql")
    print("\n3. Test main website:")
    print(f"   {Colors.CYAN}{FRONTEND_BASE}{Colors.END}")
    print("\n4. Access admin panel:")
    print(f"   {Colors.CYAN}{FRONTEND_BASE}/admin-login.html{Colors.END}")
    print("   Login: starlinktokenwifi@gmail.com / admin123")

def main():
    """Main test function"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║        Starlink WiFi System Test Script                   ║")
    print("║        Testing all components...                          ║")
    print("╚════════════════════════════════════════════════════════════╝")
    print(Colors.END)
    
    # Run all tests
    results = {
        "Frontend Server": test_frontend(),
        "Backend Health": test_backend_health(),
        "Gallery API": test_gallery(),
        "Bundles API": test_bundles(),
        "Messages API": test_messages(),
        "Contact Form": test_contact_form()
    }
    
    # Print summary
    print_summary(results)
    print_next_steps()
    
    # Exit with appropriate code
    if all(results.values()):
        print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 All tests passed!{Colors.END}\n")
        sys.exit(0)
    else:
        print(f"\n{Colors.YELLOW}{Colors.BOLD}⚠️  Some tests failed - see details above{Colors.END}\n")
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Test interrupted by user{Colors.END}\n")
        sys.exit(130)
    except Exception as e:
        print(f"\n{Colors.RED}Unexpected error: {str(e)}{Colors.END}\n")
        sys.exit(1)

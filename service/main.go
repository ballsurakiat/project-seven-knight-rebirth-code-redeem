package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

type DetailedPost struct {
	Title     string    `json:"title"`
	URL       string    `json:"url"`
	Content   string    `json:"content"`
	Coupons   []string  `json:"coupons"`
	ScrapedAt time.Time `json:"scraped_at"`
}

func main() {
	baseURL := "https://forum.netmarble.com"
	listURL := baseURL + "/sk_rebirth_gl/list/71/1"
	keyword := "รวมคูปอง"
	
	client := &http.Client{Timeout: 30 * time.Second}
	
	// 1. Get List
	req, _ := http.NewRequest("GET", listURL, nil)
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0")
	
	res, err := client.Do(req)
	if err != nil {
		log.Fatal(err)
	}
	defer res.Body.Close()

	doc, _ := goquery.NewDocumentFromReader(res.Body)
	var results []DetailedPost

	doc.Find(".article_list ul li").Each(func(i int, s *goquery.Selection) {
		title := strings.TrimSpace(s.Find(".subject a").Text())
		link, _ := s.Find(".subject a").Attr("href")

		if strings.Contains(title, keyword) {
			fullURL := baseURL + link
			// 2. Fetch Deep Detail
			content, coupons := fetchDetail(client, fullURL)
			
			results = append(results, DetailedPost{
				Title:     title,
				URL:       fullURL,
				Content:   content,
				Coupons:   coupons,
				ScrapedAt: time.Now(),
			})
		}
	})

	// 3. Save JSON
	file, _ := json.MarshalIndent(results, "", "  ")
	_ = os.WriteFile("result.json", file, 0644)
	fmt.Printf("Done! Saved %d posts to result.json\n", len(results))
}

func fetchDetail(client *http.Client, url string) (string, []string) {
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0")
	
	res, err := client.Do(req)
	if err != nil {
		return "", nil
	}
	defer res.Body.Close()

	doc, _ := goquery.NewDocumentFromReader(res.Body)
	
	// Netmarble Forum content selector
	contentArea := doc.Find(".view_detail")
	text := strings.TrimSpace(contentArea.Text())
	
	// Simple Coupon Regex (e.g., SKRE1234, BORNAGAIN77)
	re := regexp.MustCompile(`[A-Z0-9]{8,15}`)
	coupons := re.FindAllString(text, -1)
	
	// Clean duplicates
	uniqueCoupons := make([]string, 0)
	m := make(map[string]bool)
	for _, val := range coupons {
		if _, ok := m[val]; !ok {
			m[val] = true
			uniqueCoupons = append(uniqueCoupons, val)
		}
	}

	return text, uniqueCoupons
}
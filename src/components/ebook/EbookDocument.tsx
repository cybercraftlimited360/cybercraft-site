import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import React from "react";

const styles = StyleSheet.create({
  page: { backgroundColor: "#ffffff", paddingHorizontal: 60, paddingVertical: 72, fontFamily: "Helvetica" },
  coverPage: { backgroundColor: "#0a0c12", padding: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" },

  // Cover
  coverTop: { flex: 1, padding: 60, justifyContent: "center" },
  coverBrand: { fontSize: 9, color: "#f97316", letterSpacing: 3, textTransform: "uppercase", marginBottom: 40 },
  coverTitle: { fontSize: 36, color: "#ffffff", fontFamily: "Helvetica-Bold", lineHeight: 1.25, marginBottom: 16, maxWidth: 400 },
  coverSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, maxWidth: 380 },
  coverBar: { height: 3, backgroundColor: "#f97316", marginHorizontal: 60, marginBottom: 4 },
  coverBarAccent: { height: 3, backgroundColor: "#ec4899", marginHorizontal: 60, marginBottom: 60 },
  coverAuthor: { paddingHorizontal: 60, paddingBottom: 50 },
  coverAuthorName: { fontSize: 13, color: "#ffffff", fontFamily: "Helvetica-Bold", marginBottom: 4 },
  coverAuthorBiz: { fontSize: 11, color: "rgba(255,255,255,0.4)" },

  // TOC
  tocTitle: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#0a0c12", marginBottom: 32 },
  tocItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  tocChapter: { fontSize: 12, color: "#0a0c12", flex: 1 },
  tocPage: { fontSize: 11, color: "#f97316", fontFamily: "Helvetica-Bold" },

  // Chapter
  chapterLabel: { fontSize: 9, color: "#f97316", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 },
  chapterTitle: { fontSize: 26, fontFamily: "Helvetica-Bold", color: "#0a0c12", lineHeight: 1.2, marginBottom: 28 },
  accentLine: { height: 2, width: 48, backgroundColor: "#f97316", marginBottom: 28 },
  body: { fontSize: 11.5, color: "#333333", lineHeight: 1.75 },

  // Conclusion
  conclusionBox: { backgroundColor: "#fff8f3", borderLeftWidth: 3, borderLeftColor: "#f97316", padding: 20, marginBottom: 24 },
  conclusionTitle: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#0a0c12", marginBottom: 16 },

  // Bio
  bioBox: { backgroundColor: "#f9f9f9", borderRadius: 6, padding: 20, marginTop: 32 },
  bioLabel: { fontSize: 9, color: "#f97316", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 },
  bioText: { fontSize: 11, color: "#555555", lineHeight: 1.65 },

  // Footer
  footer: { position: "absolute", bottom: 32, left: 60, right: 60, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  footerText: { fontSize: 8.5, color: "#aaaaaa" },
  footerBrand: { fontSize: 8.5, color: "#f97316" },
});

type EbookContent = {
  title: string;
  subtitle: string;
  chapters: { title: string; content: string }[];
  conclusion: string;
  authorBio: string;
};

function Footer({ businessName, pageNum }: { businessName: string; pageNum: number }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>{businessName}</Text>
      <Text style={styles.footerBrand}>cybercraft360.com</Text>
      <Text style={styles.footerText}>{pageNum}</Text>
    </View>
  );
}

export function EbookDocument({
  content,
  author,
  businessName,
  email,
}: {
  content: EbookContent;
  author: string;
  businessName: string;
  email: string;
}) {
  return (
    <Document title={content.title} author={author} creator="CyberCraft360 AI eBook Generator">

      {/* Cover */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverTop}>
          <Text style={styles.coverBrand}>CyberCraft360 · AI eBook</Text>
          <Text style={styles.coverTitle}>{content.title}</Text>
          <Text style={styles.coverSubtitle}>{content.subtitle}</Text>
        </View>
        <View style={styles.coverBar} />
        <View style={styles.coverBarAccent} />
        <View style={styles.coverAuthor}>
          <Text style={styles.coverAuthorName}>{author}</Text>
          <Text style={styles.coverAuthorBiz}>{businessName}</Text>
        </View>
      </Page>

      {/* Table of Contents */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.tocTitle}>Table of Contents</Text>
        {content.chapters.map((ch, i) => (
          <View key={i} style={styles.tocItem}>
            <Text style={styles.tocChapter}>{`${i + 1}. ${ch.title}`}</Text>
            <Text style={styles.tocPage}>{i + 3}</Text>
          </View>
        ))}
        <View style={[styles.tocItem, { marginTop: 4 }]}>
          <Text style={styles.tocChapter}>Conclusion</Text>
          <Text style={styles.tocPage}>{content.chapters.length + 3}</Text>
        </View>
        <Footer businessName={businessName} pageNum={2} />
      </Page>

      {/* Chapters */}
      {content.chapters.map((ch, i) => (
        <Page key={i} size="A4" style={styles.page}>
          <Text style={styles.chapterLabel}>{`Chapter ${i + 1}`}</Text>
          <Text style={styles.chapterTitle}>{ch.title}</Text>
          <View style={styles.accentLine} />
          <Text style={styles.body}>{ch.content}</Text>
          <Footer businessName={businessName} pageNum={i + 3} />
        </Page>
      ))}

      {/* Conclusion + Bio */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.conclusionTitle}>Conclusion</Text>
        <View style={styles.conclusionBox}>
          <Text style={styles.body}>{content.conclusion}</Text>
        </View>
        <View style={styles.bioBox}>
          <Text style={styles.bioLabel}>About the Author</Text>
          <Text style={styles.bioText}>{content.authorBio}</Text>
        </View>
        <Footer businessName={businessName} pageNum={content.chapters.length + 3} />
      </Page>

    </Document>
  );
}

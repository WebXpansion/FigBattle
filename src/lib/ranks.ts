export type UserRank = {
    id: string;
    label: string;
    minScore: number;
    maxScore: number | null;
    badgeSrc: string | null;
    background: {
      base: string;
      glow1: string;
      glow2: string;
      glow3: string;
    };
  };
  
  export const USER_RANKS: UserRank[] = [
    {
      id: "unranked",
      label: "Unranked",
      minScore: 0,
      maxScore: 0,
      badgeSrc: null,
      background: {
        base: "#111111",
        glow1: "rgba(255,255,255,0.10)",
        glow2: "rgba(120,120,120,0.20)",
        glow3: "rgba(0,0,0,0.95)",
      },
    },
    {
      id: "rank-1",
      label: "Rank 1",
      minScore: 0.5,
      maxScore: 20,
      badgeSrc: "/badges/badge1.webp",
      background: {
        base: "#2a2a2a",
        glow1: "rgba(255,255,255,0.22)",
        glow2: "rgba(170,170,170,0.28)",
        glow3: "rgba(20,20,20,0.95)",
      },
    },
    {
      id: "rank-2",
      label: "Rank 2",
      minScore: 20.5,
      maxScore: 40,
      badgeSrc: "/badges/badge2.webp",
      background: {
        base: "#071d45",
        glow1: "rgba(100,180,255,0.42)",
        glow2: "rgba(0,90,255,0.36)",
        glow3: "rgba(0,10,35,0.95)",
      },
    },
    {
      id: "rank-3",
      label: "Rank 3",
      minScore: 40.5,
      maxScore: 80,
      badgeSrc: "/badges/badge3.webp",
      background: {
        base: "#231042",
        glow1: "rgba(190,120,255,0.42)",
        glow2: "rgba(120,50,255,0.36)",
        glow3: "rgba(15,0,35,0.95)",
      },
    },
    {
      id: "rank-4",
      label: "Rank 4",
      minScore: 80.5,
      maxScore: 150,
      badgeSrc: "/badges/badge4.webp",
      background: {
        base: "#2a001f",
        glow1: "rgba(255, 220, 140, 0.95)",
        glow2: "rgba(190, 70, 255, 0.9)",
        glow3: "rgba(120, 35, 0, 1)",
      },
    },
    {
      id: "rank-5",
      label: "Rank 5",
      minScore: 150.5,
      maxScore: null,
      badgeSrc: "/badges/badge5.webp",
      background: {
        base: "#4a2b00",
        glow1: "rgba(255, 245, 180, 0.9)",
        glow2: "rgba(255, 190, 0, 0.85)",
        glow3: "rgba(160, 72, 0, 1)",
      },
    },
  ];
  
  export function getUserRank(score: number): UserRank {
    return (
      USER_RANKS.find((rank) => {
        if (rank.maxScore === null) {
          return score >= rank.minScore;
        }
  
        return score >= rank.minScore && score <= rank.maxScore;
      }) ?? USER_RANKS[0]
    );
  }
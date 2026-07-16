export interface Post {
  /** Post body / commentary. Must NOT contain the outbound link (see Sender). */
  text: string
  /** Path to the image rendered for the post (the social card). */
  imagePath: string
  /** Outbound link. Placed by the adapter wherever its platform best practices dictate. */
  link: string
}

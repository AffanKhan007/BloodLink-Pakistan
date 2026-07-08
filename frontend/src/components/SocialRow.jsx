import { FaFacebookF, FaTwitter, FaInstagram } from "react-icons/fa";

const platforms = [
  { Icon: FaFacebookF, label: "Facebook", href: "#" },
  { Icon: FaTwitter, label: "Twitter", href: "#" },
  { Icon: FaInstagram, label: "Instagram", href: "#" },
];

export default function SocialRow() {
  return (
    <ul className="social-row">
      {platforms.map(({ Icon, label, href }) => (
        <li key={label}>
          <a href={href}>
            <Icon />
            <span>{label}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

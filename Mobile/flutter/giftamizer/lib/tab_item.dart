import 'package:giftamizer/pages/group_page.dart';
import 'package:giftamizer/pages/lists_page.dart';

enum TabItem {
  groups(Groups),
  lists(Lists);

  const TabItem(this.color);
  final Type color;
}
